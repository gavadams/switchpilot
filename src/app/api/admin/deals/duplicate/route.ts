import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      )
    }

    // Get original deal
    const { data: originalDeal, error: fetchError } = await supabase
      .from('bank_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !originalDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Create duplicate
    const { id: originalId, created_at, updated_at, ...dealData } = originalDeal

    const { data: newDeal, error: insertError } = await supabase
      .from('bank_deals')
      .insert({
        ...dealData,
        bank_name: `${dealData.bank_name} (Copy)`,
        source_name: 'Manual',
        source_priority: 10,
        is_active: false, // Start as inactive
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Log deal history
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('deal_history').insert({
        deal_id: newDeal.id,
        changed_by: user.id,
        change_type: 'created',
        changes: { duplicated_from: id, deal_data: newDeal }
      })
    }

    await logAdminAction({
      actionType: 'deal_duplicate',
      targetType: 'deal',
      targetId: newDeal.id,
      actionDetails: {
        original_id: id,
        original_bank: originalDeal.bank_name,
        new_bank: newDeal.bank_name
      }
    }, req)

    return NextResponse.json({ deal: newDeal })
  } catch (error) {
    console.error('Error duplicating deal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate deal' },
      { status: 500 }
    )
  }
}

