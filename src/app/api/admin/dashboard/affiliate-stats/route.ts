import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getAffiliateStats } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const stats = await getAffiliateStats()

    await logAdminAction({
      actionType: 'dashboard_affiliate_stats_view',
      targetType: 'dashboard',
      actionDetails: stats
    }, req)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch affiliate stats' },
      { status: 500 }
    )
  }
}

