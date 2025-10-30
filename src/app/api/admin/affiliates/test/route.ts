import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    console.log('🔧 Test API called')
    await requireAdmin()
    console.log('🔧 Admin check passed')

    const supabase = await createServerSupabaseClient()

    // Test basic bank_deals query
    const { data: deals, error: dealsError } = await supabase
      .from('bank_deals')
      .select('*')
      .limit(1)

    console.log('🔧 Bank deals test:', { deals, dealsError })

    // Test affiliate_products query
    const { data: products, error: productsError } = await supabase
      .from('affiliate_products')
      .select('*')
      .limit(1)

    console.log('🔧 Affiliate products test:', { products, productsError })

    return NextResponse.json({
      success: true,
      deals: deals?.length || 0,
      products: products?.length || 0,
      dealsError: dealsError?.message,
      productsError: productsError?.message
    })
  } catch (error) {
    console.error('🔧 Test API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
