import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/auth/admin'
import { createServerSupabaseClient } from '../../../../../lib/supabase/server'

// GET - Performance metrics with date filtering
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Performance API called')
    await requireAdmin()
    console.log('🔧 Admin check passed')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    console.log('🔧 Date filters:', { startDate, endDate })

    const supabase = await createServerSupabaseClient()
    
    // First check if affiliate_clicks table exists and get basic data
    console.log('🔧 Checking affiliate_clicks table...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('affiliate_clicks')
      .select('id')
      .limit(1)

    if (tableError) {
      console.error('🔧 affiliate_clicks table error:', tableError)
      // Return empty data if table doesn't exist or has issues
      console.log('🔧 Returning empty performance data (table issue)')
      return NextResponse.json({
        summary: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          avgConversionRate: 0
        },
        performance: []
      })
    }

    console.log('🔧 affiliate_clicks table exists, building query')
    let query = supabase
      .from('affiliate_clicks')
      .select(`
        id,
        deal_id,
        product_id,
        click_type,
        clicked_at,
        converted,
        commission_earned,
        bank_deals!affiliate_clicks_deal_id_fkey (
          id,
          bank_name,
          affiliate_url,
          commission_rate
        ),
        affiliate_products!affiliate_clicks_product_id_fkey (
          id,
          product_name,
          provider_name,
          affiliate_commission
        )
      `)

    if (startDate) {
      query = query.gte('clicked_at', startDate)
      console.log('🔧 Added startDate filter:', startDate)
    }

    if (endDate) {
      query = query.lte('clicked_at', endDate)
      console.log('🔧 Added endDate filter:', endDate)
    }

    console.log('🔧 Executing query...')
    const { data, error } = await query
    console.log('🔧 Query completed, data length:', data?.length, 'error:', error)

    if (error) {
      console.error('Error fetching affiliate performance:', error)
      // Return empty data instead of failing completely
      console.log('🔧 Returning empty performance data due to error')
      return NextResponse.json({
        summary: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          avgConversionRate: 0
        },
        performance: []
      })
    }
    
    // Aggregate data by affiliate
    const performanceMap = new Map<string, {
      id: string
      name: string
      type: 'bank_deal' | 'affiliate_product'
      clicks: number
      conversions: number
      revenue: number
    }>()
    
    data?.forEach((click: {
      click_type: 'bank_deal' | 'affiliate_product';
      deal_id: string | null;
      product_id: string | null;
      converted: boolean;
      commission_earned: number;
      bank_deals?: { bank_name: string } | null;
      affiliate_products?: { provider_name: string; product_name: string } | null;
    }) => {
      let key: string
      let name: string
      let type: 'bank_deal' | 'affiliate_product'
      
      if (click.click_type === 'bank_deal' && click.bank_deals) {
        key = `bank_deal_${click.deal_id}`
        name = click.bank_deals.bank_name
        type = 'bank_deal'
      } else if (click.click_type === 'affiliate_product' && click.affiliate_products) {
        key = `affiliate_product_${click.product_id}`
        name = `${click.affiliate_products.provider_name} - ${click.affiliate_products.product_name}`
        type = 'affiliate_product'
      } else {
        return // Skip if no valid affiliate data
      }
      
      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          id: (click.deal_id || click.product_id) as string,
          name,
          type,
          clicks: 0,
          conversions: 0,
          revenue: 0
        })
      }
      
      const stats = performanceMap.get(key)!
      stats.clicks++
      if (click.converted) {
        stats.conversions++
        stats.revenue += click.commission_earned || 0
      }
    })
    
    // Convert to array and add conversion rate
    const performance = Array.from(performanceMap.values()).map(stat => ({
      ...stat,
      conversionRate: stat.clicks > 0 ? (stat.conversions / stat.clicks) * 100 : 0
    }))
    
    // Calculate summary stats
    const summary = {
      totalClicks: data?.length || 0,
      totalConversions: data?.filter((c: { converted: boolean }) => c.converted).length || 0,
      totalRevenue: data?.reduce((sum: number, c: { commission_earned: number }) => sum + (c.commission_earned || 0), 0) || 0,
      avgConversionRate: data && data.length > 0 
        ? (data.filter((c: { converted: boolean }) => c.converted).length / data.length) * 100 
        : 0
    }
    
    return NextResponse.json({
      summary,
      performance
    })
  } catch (error) {
    console.error('🔧 Performance API error:', error)
    console.error('🔧 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    )
  }
}

