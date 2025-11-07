import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getUserDetail } from '@/lib/supabase/admin-data'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Get user detail
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const params = await context.params

    const userDetail = await getUserDetail(params.id)

    await logAdminAction({
      actionType: 'user_view',
      targetType: 'user',
      targetId: params.id,
      targetEmail: userDetail.profile.email
    }, req)

    return NextResponse.json(userDetail)
  } catch (error) {
    console.error('Error fetching user detail:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const params = await context.params

    const body = await req.json()
    const { email, full_name, is_suspended, suspension_reason, suspended_until } = body

    // Get original user for audit log
    const { data: originalUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!originalUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user
    const updates: Record<string, unknown> = {}
    if (email !== undefined) updates.email = email
    if (full_name !== undefined) updates.full_name = full_name
    if (is_suspended !== undefined) updates.is_suspended = is_suspended
    if (suspension_reason !== undefined) updates.suspension_reason = suspension_reason
    if (suspended_until !== undefined) updates.suspended_until = suspended_until

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    await logAdminAction({
      actionType: 'user_update',
      targetType: 'user',
      targetId: params.id,
      targetEmail: updatedUser.email,
      actionDetails: {
        before: originalUser,
        after: updatedUser,
        changes: updates
      }
    }, req)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (soft delete by suspending)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()
    const params = await context.params

    // Get user for audit log
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', params.id)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete: suspend user permanently
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: 'Account deleted by admin',
        suspended_until: null
      })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    await logAdminAction({
      actionType: 'user_delete',
      targetType: 'user',
      targetId: params.id,
      targetEmail: user.email,
      actionDetails: { reason: 'Account deleted by admin' }
    }, req)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}

