import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getUserStats, getAllSwitches, getRevenueMetrics } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createClient()

    // Get user stats
    const userStats = await getUserStats()

    // Get revenue metrics
    const revenueMetrics = await getRevenueMetrics()

    // Get active switches
    const { switches } = await getAllSwitches({ status: 'all', limit: 1000 })
    const activeSwitches = switches.filter(s => 
      s.status !== 'completed' && s.status !== 'failed'
    ).length

    // Calculate completed switches this week
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const completedThisWeek = switches.filter(s => 
      s.status === 'completed' && 
      s.completed_at && 
      s.completed_at >= weekStart &&
      s.completed_at <= weekEnd
    ).length

    // Get failed payments this week
    const today = new Date()
    const weekStartDate = startOfWeek(today, { weekStartsOn: 1 })
    const weekEndDate = endOfWeek(today, { weekStartsOn: 1 })
    
    const { count: failedPaymentsThisWeek } = await supabase
      .from('dd_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', weekStartDate.toISOString())
      .lte('created_at', weekEndDate.toISOString())

    // Calculate stalled switches (no progress in 7+ days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const stalledSwitches = switches.filter(s => 
      (s.status === 'started' || s.status === 'in_progress' || s.status === 'waiting') &&
      s.updated_at &&
      s.updated_at < sevenDaysAgo
    ).length

    // Calculate revenue growth (current month vs last month)
    const revenueGrowthLastMonth = revenueMetrics.lastMonthRevenue > 0
      ? ((revenueMetrics.thisMonthRevenue - revenueMetrics.lastMonthRevenue) / revenueMetrics.lastMonthRevenue) * 100
      : (revenueMetrics.thisMonthRevenue > 0 ? 100 : 0)

    // Calculate user growth (this month vs last month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const { count: usersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart.toISOString())

    const { count: usersLastMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString())

    const newUserGrowthLastMonth = usersLastMonth && usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : (usersThisMonth && usersThisMonth > 0 ? 100 : 0)

    // System health (simplified - would need actual health check)
    const systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Open support issues (simplified - no support ticket system yet)
    const openSupportIssues = 0

    const stats = {
      totalUsers: userStats.totalUsers,
      activeSwitches,
      currentMonthRevenue: revenueMetrics.thisMonthRevenue,
      revenueGrowthLastMonth: Math.round(revenueGrowthLastMonth * 100) / 100,
      systemHealth,
      newUsersToday: userStats.newUsersToday,
      newUserGrowthLastMonth: Math.round(newUserGrowthLastMonth * 100) / 100,
      completedSwitchesThisWeek: completedThisWeek,
      failedPaymentsThisWeek: failedPaymentsThisWeek || 0,
      stalledSwitches,
      openSupportIssues
    }

    // Log action
    await logAdminAction({
      actionType: 'dashboard_view',
      targetType: 'dashboard',
      actionDetails: { stats }
    }, req)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

