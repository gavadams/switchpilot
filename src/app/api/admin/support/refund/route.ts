import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { userId, amount, reason, paymentId } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      )
    }

    // Get user for audit log
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    // TODO: Integrate with Stripe to issue actual refund
    // For now, log the action

    await logAdminAction({
      actionType: 'refund_issue',
      targetType: 'user',
      targetId: userId,
      targetEmail: user?.email,
      actionDetails: {
        amount,
        reason,
        paymentId
      }
    }, req)

    return NextResponse.json({ success: true, message: 'Refund issued successfully' })
  } catch (error) {
    console.error('Error issuing refund:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue refund' },
      { status: 500 }
    )
  }
}

