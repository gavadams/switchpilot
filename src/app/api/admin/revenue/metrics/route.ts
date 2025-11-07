import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getRevenueMetrics } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined
    const metrics = await getRevenueMetrics(dateRange)

    await logAdminAction({
      actionType: 'revenue_metrics_view',
      targetType: 'revenue',
      actionDetails: { dateRange, metrics }
    }, req)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching revenue metrics:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch revenue metrics' },
      { status: 500 }
    )
  }
}

