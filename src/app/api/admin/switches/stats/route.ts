import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createClient()

    const now = new Date()
    const thisMonthStart = startOfMonth(now).toISOString()
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

    // Active switches (not completed or failed)
    const { count: activeSwitches } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .not('status', 'eq', 'completed')
      .not('status', 'eq', 'failed')

    // Completed switches this month
    const { count: completedThisMonth } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', thisMonthStart)

    // Completed switches this week
    const { count: completedThisWeek } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', thisWeekStart)
      .lte('completed_at', thisWeekEnd)

    // Total switches
    const { count: totalSwitches } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })

    // Completed switches (for success rate)
    const { count: completedSwitches } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Failed switches
    const { count: failedSwitches } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    // Calculate success rate
    const totalCompletedOrFailed = (completedSwitches || 0) + (failedSwitches || 0)
    const successRate = totalCompletedOrFailed > 0
      ? Math.round(((completedSwitches || 0) / totalCompletedOrFailed) * 100)
      : 0

    // Calculate average completion time (in days)
    const { data: completedSwitchesData } = await supabase
      .from('user_switches')
      .select('started_at, completed_at')
      .eq('status', 'completed')
      .not('started_at', 'is', null)
      .not('completed_at', 'is', null)

    let avgCompletionTime = 0
    if (completedSwitchesData && completedSwitchesData.length > 0) {
      const completionTimes = completedSwitchesData
        .map(s => {
          if (!s.started_at || !s.completed_at) return null
          const start = new Date(s.started_at).getTime()
          const end = new Date(s.completed_at).getTime()
          return (end - start) / (1000 * 60 * 60 * 24) // Convert to days
        })
        .filter((t): t is number => t !== null)

      if (completionTimes.length > 0) {
        avgCompletionTime = Math.round(
          (completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length) * 10
        ) / 10
      }
    }

    // Stuck switches (no progress in 7+ days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: stuckSwitches } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .in('status', ['started', 'in_progress', 'waiting'])
      .lt('updated_at', sevenDaysAgo)

    const stats = {
      activeSwitches: activeSwitches || 0,
      completedThisMonth: completedThisMonth || 0,
      completedThisWeek: completedThisWeek || 0,
      totalSwitches: totalSwitches || 0,
      successRate,
      avgCompletionTime,
      stuckSwitches: stuckSwitches || 0
    }

    await logAdminAction({
      actionType: 'switch_stats_view',
      targetType: 'switch',
      actionDetails: { stats }
    }, req)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching switch stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch switch stats' },
      { status: 500 }
    )
  }
}

