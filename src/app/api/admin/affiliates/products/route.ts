import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'

// GET - Fetch all products (including inactive)
export async function GET() {
  console.log('🔧 API: Products GET called')
  try {
    await requireAdmin()

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('affiliate_products')
      .select('*')
      .order('provider_name', { ascending: true })
      .order('product_name', { ascending: true })

    if (error) {
      console.error('Error fetching affiliate products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
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

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const {
      productName,
      providerName,
      productType,
      description,
      affiliateUrl,
      affiliateProvider,
      affiliateCommission,
      isActive
    } = body
    
    if (!productName || !providerName || !productType || !affiliateUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('affiliate_products')
      .insert({
        product_name: productName,
        provider_name: providerName,
        product_type: productType,
        description: description || null,
        affiliate_url: affiliateUrl,
        affiliate_provider: affiliateProvider || null,
        affiliate_commission: affiliateCommission || 0,
        is_active: isActive ?? true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating affiliate product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
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

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const {
      productId,
      productName,
      providerName,
      productType,
      description,
      affiliateUrl,
      affiliateProvider,
      affiliateCommission,
      isActive
    } = body
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (productName !== undefined) updateData.product_name = productName
    if (providerName !== undefined) updateData.provider_name = providerName
    if (productType !== undefined) updateData.product_type = productType
    if (description !== undefined) updateData.description = description
    if (affiliateUrl !== undefined) updateData.affiliate_url = affiliateUrl
    if (affiliateProvider !== undefined) updateData.affiliate_provider = affiliateProvider
    if (affiliateCommission !== undefined) updateData.affiliate_commission = affiliateCommission
    if (isActive !== undefined) updateData.is_active = isActive
    
    const { data, error } = await supabase
      .from('affiliate_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating affiliate product:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
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

// DELETE - Delete product by ID
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('affiliate_products')
      .delete()
      .eq('id', productId)
    
    if (error) {
      console.error('Error deleting affiliate product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}

