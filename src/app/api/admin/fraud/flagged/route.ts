import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getFlaggedAccounts } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const flaggedAccounts = await getFlaggedAccounts()

    await logAdminAction({
      actionType: 'fraud_flagged_view',
      targetType: 'fraud',
      actionDetails: { count: flaggedAccounts.length }
    }, req)

    return NextResponse.json({ accounts: flaggedAccounts })
  } catch (error) {
    console.error('Error fetching flagged accounts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch flagged accounts' },
      { status: 500 }
    )
  }
}

