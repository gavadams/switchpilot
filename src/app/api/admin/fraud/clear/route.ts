import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { userId, reason } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Clear fraud flag (would update flagged_accounts table if it existed)
    // For now, just log the action

    await logAdminAction({
      actionType: 'fraud_flag_clear',
      targetType: 'user',
      targetId: userId,
      actionDetails: { reason }
    }, req)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing fraud flag:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear fraud flag' },
      { status: 500 }
    )
  }
}

