import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { userId, amount, reason } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user } = await supabase
      .from('profiles')
      .select('total_earnings, email')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user's total earnings
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_earnings: (user.total_earnings || 0) + amount
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    await logAdminAction({
      actionType: 'credit_issue',
      targetType: 'user',
      targetId: userId,
      targetEmail: user.email,
      actionDetails: {
        amount,
        reason,
        new_total: (user.total_earnings || 0) + amount
      }
    }, req)

    return NextResponse.json({ success: true, message: 'Credit applied successfully' })
  } catch (error) {
    console.error('Error issuing credit:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue credit' },
      { status: 500 }
    )
  }
}

