import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { earnings } = await req.json()

    // Get switch details
    const { data: switchItem } = await supabase
      .from('user_switches')
      .select('user_id, bank_deals(bank_name)')
      .eq('id', params.id)
      .single()

    if (!switchItem) {
      return NextResponse.json(
        { error: 'Switch not found' },
        { status: 404 }
      )
    }

    // Complete switch
    const { error: updateError } = await supabase
      .from('user_switches')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        earnings_received: earnings || 0
      })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    await logAdminAction({
      actionType: 'switch_complete_manual',
      targetType: 'switch',
      targetId: params.id,
      actionDetails: {
        user_id: switchItem.user_id,
        earnings: earnings || 0,
        bank: (switchItem.bank_deals as any)?.bank_name
      }
    }, req)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing switch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete switch' },
      { status: 500 }
    )
  }
}

