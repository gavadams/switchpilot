import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getStuckSwitches } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const stuckSwitches = await getStuckSwitches()

    await logAdminAction({
      actionType: 'stuck_switches_view',
      targetType: 'switches',
      actionDetails: { count: stuckSwitches.length }
    }, req)

    return NextResponse.json({ switches: stuckSwitches })
  } catch (error) {
    console.error('Error fetching stuck switches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stuck switches' },
      { status: 500 }
    )
  }
}

