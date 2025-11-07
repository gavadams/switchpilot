import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getSystemHealthMetrics } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const health = await getSystemHealthMetrics()

    await logAdminAction({
      actionType: 'system_health_view',
      targetType: 'system',
      actionDetails: health
    }, req)

    return NextResponse.json(health)
  } catch (error) {
    console.error('Error fetching system health:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch system health' },
      { status: 500 }
    )
  }
}

