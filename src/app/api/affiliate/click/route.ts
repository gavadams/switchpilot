import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase/server'
import { trackAffiliateClick } from '../../../../lib/supabase/affiliates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { clickType, referenceId } = body

    // Validate required fields
    if (!clickType || !referenceId) {
      return NextResponse.json(
        { error: 'clickType and referenceId are required' },
        { status: 400 }
      )
    }

    // Validate clickType
    if (!['bank_deal', 'affiliate_product'].includes(clickType)) {
      return NextResponse.json(
        { error: 'Invalid clickType. Must be "bank_deal" or "affiliate_product"' },
        { status: 400 }
      )
    }

    // Get request metadata
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Track the click
    const click = await trackAffiliateClick(
      user.id,
      clickType,
      referenceId,
      {
        ipAddress,
        userAgent,
        referrer
      }
    )

    return NextResponse.json({
      success: true,
      clickId: click.id,
      message: 'Click tracked successfully'
    })

  } catch (error) {
    console.error('Error tracking affiliate click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
