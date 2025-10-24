import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { 
  addBankDealAffiliate, 
  updateBankDealAffiliate, 
  removeBankDealAffiliate 
} from '../../../../../lib/supabase/admin-affiliates'

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin()

    const body = await request.json()
    const { dealId, affiliateData } = body

    // Validate required fields
    if (!dealId || !affiliateData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!affiliateData.affiliate_url || !affiliateData.affiliate_provider || 
        affiliateData.affiliate_commission === undefined) {
      return NextResponse.json({ 
        error: 'Missing required affiliate fields: affiliate_url, affiliate_provider, affiliate_commission' 
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(affiliateData.affiliate_url)
    } catch {
      return NextResponse.json({ error: 'Invalid affiliate URL format' }, { status: 400 })
    }

    // Validate commission is a number
    if (typeof affiliateData.affiliate_commission !== 'number' || affiliateData.affiliate_commission < 0) {
      return NextResponse.json({ error: 'Commission must be a positive number' }, { status: 400 })
    }

    // Add affiliate link to bank deal
    const result = await addBankDealAffiliate(dealId, affiliateData)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error adding bank deal affiliate:', error)
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
    const { dealId, updates } = body

    if (!dealId || !updates) {
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
    if (updates.commission_rate !== undefined) {
      if (typeof updates.commission_rate !== 'number' || updates.commission_rate < 0) {
        return NextResponse.json({ error: 'Commission must be a positive number' }, { status: 400 })
      }
    }

    // Update affiliate link
    const result = await updateBankDealAffiliate(dealId, updates)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating bank deal affiliate:', error)
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
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId parameter' }, { status: 400 })
    }

    // Remove affiliate link
    const result = await removeBankDealAffiliate(dealId)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error removing bank deal affiliate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}