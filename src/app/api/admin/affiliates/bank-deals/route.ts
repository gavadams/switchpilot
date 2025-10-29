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
    console.log('🔧 Bank deals PUT called')
    await requireAdmin()
    console.log('🔧 Admin check passed for PUT')

    const body = await request.json()
    const { dealId, affiliateUrl, affiliateProvider, commissionRate, trackingEnabled } = body
    console.log('🔧 PUT request data:', { dealId, affiliateUrl, affiliateProvider, commissionRate, trackingEnabled })

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    console.log('🔧 Supabase client created')

    // Check which columns exist in the table
    const { data: columnCheck, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'bank_deals')
      .in('column_name', ['affiliate_url', 'affiliate_provider', 'commission_rate', 'tracking_enabled'])

    console.log('🔧 Available columns:', columnCheck?.map(c => c.column_name))

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only add columns that exist
    if (columnCheck?.some(c => c.column_name === 'affiliate_url')) {
      updateData.affiliate_url = affiliateUrl || null
    }
    if (columnCheck?.some(c => c.column_name === 'affiliate_provider')) {
      updateData.affiliate_provider = affiliateProvider || null
    }
    if (columnCheck?.some(c => c.column_name === 'commission_rate')) {
      updateData.commission_rate = commissionRate || 0
    }
    if (columnCheck?.some(c => c.column_name === 'tracking_enabled')) {
      updateData.tracking_enabled = trackingEnabled ?? !!affiliateUrl
    }

    console.log('🔧 Final update data:', updateData)

    const { data, error } = await supabase
      .from('bank_deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single()

    console.log('🔧 Supabase query result - data:', data, 'error:', error)

    if (error) {
      console.error('Error updating bank deal affiliate:', error)
      return NextResponse.json(
        { error: `Failed to update affiliate data: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('🔧 Bank deal updated successfully')
    return NextResponse.json(data)
  } catch (error) {
    console.error('🔧 Bank deals PUT error:', error)
    console.error('🔧 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    )
  }
}

// DELETE - Remove affiliate from bank deal (set fields to null)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')
    
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
        affiliate_url: null,
        affiliate_provider: null,
        commission_rate: 0,
        tracking_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single()
    
    if (error) {
      console.error('Error removing affiliate from bank deal:', error)
      return NextResponse.json(
        { error: 'Failed to remove affiliate data' },
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

