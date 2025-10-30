import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'

// GET - Fetch all bank deals with affiliate data (no active filter for admin)
export async function GET() {
  console.log('🔧 API: Bank deals GET called')
  try {
    await requireAdmin()

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('bank_deals')
      .select('*')
      .order('bank_name', { ascending: true })

    if (error) {
      console.error('Error fetching bank deals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bank deals' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}

// POST - Add affiliate data to existing bank deal
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { dealId, affiliateUrl, affiliateProvider, commissionRate } = body
    
    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('bank_deals')
      .update({
        affiliate_url: affiliateUrl || null,
        affiliate_provider: affiliateProvider || null,
        commission_rate: commissionRate || 0,
        tracking_enabled: !!affiliateUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single()
    
    if (error) {
      console.error('Error adding affiliate to bank deal:', error)
      return NextResponse.json(
        { error: 'Failed to add affiliate data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}

// PUT - Update affiliate fields
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { dealId, affiliateUrl, affiliateProvider, commissionRate, trackingEnabled } = body

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Prepare update data - assume columns exist (they should after running migrations)
    const updateData: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
      affiliate_url: affiliateUrl || null,
      affiliate_provider: affiliateProvider || null,
      commission_rate: commissionRate || 0,
      tracking_enabled: trackingEnabled ?? !!affiliateUrl
    }

    const { data, error } = await supabase
      .from('bank_deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single()

    if (error) {
      console.error('Error updating bank deal affiliate:', error)
      return NextResponse.json(
        { error: `Failed to update affiliate data: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Bank deals PUT error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    )
  }
}

// DELETE - Remove affiliate from bank deal (set fields to null)
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE called for bank deals')
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')
    console.log('Deal ID to delete:', dealId)

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // First check if the deal exists
    const { data: existingDeal, error: fetchError } = await supabase
      .from('bank_deals')
      .select('id, bank_name')
      .eq('id', dealId)
      .single()

    console.log('Existing deal:', existingDeal, 'fetch error:', fetchError)

    if (fetchError || !existingDeal) {
      console.error('Deal not found:', fetchError)
      return NextResponse.json(
        { error: 'Bank deal not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('bank_deals')
      .update({
        affiliate_url: null,
        affiliate_provider: null,
        commission_rate: 0,
        tracking_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single()

    console.log('Update result:', data, 'error:', error)

    if (error) {
      console.error('Error removing affiliate from bank deal:', error)
      return NextResponse.json(
        { error: `Failed to remove affiliate data: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Successfully removed affiliate data')
    return NextResponse.json(data)
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    )
  }
}

