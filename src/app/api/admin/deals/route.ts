import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List all deals
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || 'all'
    const source = searchParams.get('source') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('bank_deals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('bank_name', `%${search}%`)
    }

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    if (source !== 'all') {
      query = query.eq('source_name', source)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    await logAdminAction({
      actionType: 'deals_list_view',
      targetType: 'deals',
      actionDetails: { filters: { search, status, source }, count: count || 0 }
    }, req)

    return NextResponse.json({
      deals: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

// POST - Create new deal
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const dealData = await req.json()

    if (!dealData.bank_name || !dealData.reward_amount) {
      return NextResponse.json(
        { error: 'Bank name and reward amount are required' },
        { status: 400 }
      )
    }

    // Insert deal with manual source
    const { data: deal, error } = await supabase
      .from('bank_deals')
      .insert({
        ...dealData,
        source_name: 'Manual',
        source_priority: 10,
        is_active: dealData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log deal history
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('deal_history').insert({
        deal_id: deal.id,
        changed_by: user.id,
        change_type: 'created',
        changes: { deal_data: deal }
      })
    }

    await logAdminAction({
      actionType: 'deal_create',
      targetType: 'deal',
      targetId: deal.id,
      actionDetails: {
        bank_name: dealData.bank_name,
        reward_amount: dealData.reward_amount
      }
    }, req)

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Error creating deal:', error)
    await logAdminAction({
      actionType: 'deal_create',
      result: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to create deal'
    }, req)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create deal' },
      { status: 500 }
    )
  }
}

// PATCH - Update deal
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      )
    }

    // Get original deal
    const { data: originalDeal } = await supabase
      .from('bank_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!originalDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Update deal
    const { data: deal, error } = await supabase
      .from('bank_deals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log deal history
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('deal_history').insert({
        deal_id: id,
        changed_by: user.id,
        change_type: 'updated',
        changes: { before: originalDeal, after: deal, updates }
      })
    }

    await logAdminAction({
      actionType: 'deal_update',
      targetType: 'deal',
      targetId: id,
      actionDetails: {
        before: originalDeal,
        after: deal,
        changes: updates
      }
    }, req)

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update deal' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete deal (set inactive)
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID required' },
        { status: 400 }
      )
    }

    // Get deal for audit log
    const { data: deal } = await supabase
      .from('bank_deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Soft delete (set inactive)
    const { error: updateError } = await supabase
      .from('bank_deals')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Log deal history
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('deal_history').insert({
        deal_id: id,
        changed_by: user.id,
        change_type: 'deactivated',
        changes: { deal_data: deal }
      })
    }

    await logAdminAction({
      actionType: 'deal_delete',
      targetType: 'deal',
      targetId: id,
      actionDetails: {
        bank_name: deal.bank_name,
        reward_amount: deal.reward_amount
      }
    }, req)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete deal' },
      { status: 500 }
    )
  }
}

