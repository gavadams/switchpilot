import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getUserStats } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const stats = await getUserStats()

    await logAdminAction({
      actionType: 'users_stats_view',
      targetType: 'users',
      actionDetails: stats
    }, req)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

