import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getAllSwitches, getStuckSwitches } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const filters = {
      status: (searchParams.get('status') as any) || 'all',
      bankName: searchParams.get('bankName') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    }

    const result = await getAllSwitches(filters)

    await logAdminAction({
      actionType: 'switches_list_view',
      targetType: 'switches',
      actionDetails: { filters, count: result.total }
    }, req)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching switches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch switches' },
      { status: 500 }
    )
  }
}

