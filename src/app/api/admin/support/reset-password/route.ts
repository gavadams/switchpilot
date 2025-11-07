import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate password reset link via Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email
    })

    if (error) {
      throw error
    }

    await logAdminAction({
      actionType: 'password_reset_generate',
      targetType: 'user',
      targetEmail: email,
      actionDetails: {
        resetLinkGenerated: true
      }
    }, req)

    return NextResponse.json({
      success: true,
      resetLink: data.properties.action_link,
      message: 'Password reset link generated'
    })
  } catch (error) {
    console.error('Error generating password reset:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate password reset link' },
      { status: 500 }
    )
  }
}

