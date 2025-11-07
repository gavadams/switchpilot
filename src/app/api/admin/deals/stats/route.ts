import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createClient()

    const now = new Date()
    const thisMonthStart = startOfMonth(now).toISOString()
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

    // Total deals
    const { count: totalDeals } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })

    // Active deals
    const { count: activeDeals } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Deals added this month
    const { count: addedThisMonth } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart)

    // Deals updated this week
    const { count: updatedThisWeek } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thisWeekStart)
      .lte('updated_at', thisWeekEnd)

    // Manual deals count
    const { count: manualDeals } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })
      .eq('source_name', 'Manual')

    // Scraped deals count
    const { count: scrapedDeals } = await supabase
      .from('bank_deals')
      .select('*', { count: 'exact', head: true })
      .neq('source_name', 'Manual')

    const stats = {
      totalDeals: totalDeals || 0,
      activeDeals: activeDeals || 0,
      addedThisMonth: addedThisMonth || 0,
      updatedThisWeek: updatedThisWeek || 0,
      manualDeals: manualDeals || 0,
      scrapedDeals: scrapedDeals || 0
    }

    await logAdminAction({
      actionType: 'deal_stats_view',
      targetType: 'deal',
      actionDetails: { stats }
    }, req)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching deal stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deal stats' },
      { status: 500 }
    )
  }
}

