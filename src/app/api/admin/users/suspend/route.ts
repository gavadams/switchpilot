import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { userId, reason, duration } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user details for logging
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, is_suspended')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate suspended_until date
    const suspendedUntil = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Suspend user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: reason || 'Account suspended by admin',
        suspended_until: suspendedUntil
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    await logAdminAction({
      actionType: 'user_suspend',
      targetType: 'user',
      targetId: userId,
      targetEmail: user.email,
      actionDetails: {
        reason: reason || 'Account suspended by admin',
        duration: duration ? `${duration} days` : 'permanent',
        suspended_until: suspendedUntil
      }
    }, req)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error suspending user:', error)
    await logAdminAction({
      actionType: 'user_suspend',
      result: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to suspend user'
    }, req)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suspend user' },
      { status: 500 }
    )
  }
}

