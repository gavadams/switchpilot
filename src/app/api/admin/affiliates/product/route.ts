import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { 
  createAffiliateProduct, 
  updateAffiliateProduct, 
  deleteAffiliateProduct,
  bulkUpdateProducts
} from '../../../../../lib/supabase/admin-affiliates'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin()

    const body = await request.json()
    const { productData } = body

    if (!productData) {
      return NextResponse.json({ error: 'Missing product data' }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = [
      'product_type', 
      'provider_name', 
      'product_name', 
      'description', 
      'affiliate_url', 
      'affiliate_commission'
    ]
    
    for (const field of requiredFields) {
      if (!productData[field] && productData[field] !== 0) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 })
      }
    }

    // Validate URL format
    try {
      new URL(productData.affiliate_url)
    } catch {
      return NextResponse.json({ error: 'Invalid affiliate URL format' }, { status: 400 })
    }

    // Validate commission
    if (typeof productData.affiliate_commission !== 'number' || productData.affiliate_commission < 0) {
      return NextResponse.json({ error: 'Commission must be a positive number' }, { status: 400 })
    }

    // Validate key_features is array
    if (productData.key_features && !Array.isArray(productData.key_features)) {
      return NextResponse.json({ error: 'key_features must be an array' }, { status: 400 })
    }

    // Create affiliate product
    const result = await createAffiliateProduct(productData)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating affiliate product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin()

    const body = await request.json()
    const { productId, updates } = body

    if (!productId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate URL if provided
    if (updates.affiliate_url) {
      try {
        new URL(updates.affiliate_url)
      } catch {
        return NextResponse.json({ error: 'Invalid affiliate URL format' }, { status: 400 })
      }
    }

    // Validate commission if provided
    if (updates.affiliate_commission !== undefined) {
      if (typeof updates.affiliate_commission !== 'number' || updates.affiliate_commission < 0) {
        return NextResponse.json({ error: 'Commission must be a positive number' }, { status: 400 })
      }
    }

    // Validate key_features if provided
    if (updates.key_features && !Array.isArray(updates.key_features)) {
      return NextResponse.json({ error: 'key_features must be an array' }, { status: 400 })
    }

    // Update affiliate product
    const result = await updateAffiliateProduct(productId, updates)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating affiliate product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId parameter' }, { status: 400 })
    }

    // Delete affiliate product
    await deleteAffiliateProduct(productId)
    
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Error deleting affiliate product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin()

    const body = await request.json()
    const { productIds, updates, action } = body

    if (action === 'bulk') {
      // Bulk update multiple products
      if (!productIds || !Array.isArray(productIds) || !updates) {
        return NextResponse.json({ 
          error: 'Missing required fields for bulk update' 
        }, { status: 400 })
      }

      if (productIds.length === 0) {
        return NextResponse.json({ 
          error: 'No products selected for bulk update' 
        }, { status: 400 })
      }

      // Bulk update products
      const count = await bulkUpdateProducts(productIds, updates)
      return NextResponse.json({ success: true, data: { count, updated: count } })
    } else {
      // Single product update
      if (!productIds || !updates) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Validate URL if provided
      if (updates.affiliate_url) {
        try {
          new URL(updates.affiliate_url)
        } catch {
          return NextResponse.json({ error: 'Invalid affiliate URL format' }, { status: 400 })
        }
      }

      // Update single product
      const result = await updateAffiliateProduct(productIds, updates)
      return NextResponse.json({ success: true, data: result })
    }
  } catch (error) {
    console.error('Error in PATCH affiliate product:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}