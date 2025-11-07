import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getRevenueOverTime } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const revenueData = await getRevenueOverTime(12)

    await logAdminAction({
      actionType: 'dashboard_revenue_view',
      targetType: 'dashboard',
      actionDetails: { months: 12 }
    }, req)

    return NextResponse.json(revenueData)
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

