import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getRevenueOverTime } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const months = parseInt(searchParams.get('months') || '12')

    const data = await getRevenueOverTime(months)

    await logAdminAction({
      actionType: 'revenue_overtime_view',
      targetType: 'revenue',
      actionDetails: { months }
    }, req)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching revenue over time:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

