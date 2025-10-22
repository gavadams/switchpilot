import { createClient } from './client'
import { createServerClient } from './server'

// Types for affiliate system
export interface AffiliateClick {
  id: string
  user_id: string | null
  deal_id: string | null
  product_id: string | null
  click_type: 'bank_deal' | 'affiliate_product'
  clicked_at: string
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  converted: boolean
  conversion_date: string | null
  commission_earned: number
}

export interface AffiliateClickInsert {
  user_id?: string | null
  deal_id?: string | null
  product_id?: string | null
  click_type: 'bank_deal' | 'affiliate_product'
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  converted?: boolean
  conversion_date?: string | null
  commission_earned?: number
}

export interface AffiliateStats {
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  bankDealClicks: number
  productClicks: number
  bankDealConversions: number
  productConversions: number
  bankDealRevenue: number
  productRevenue: number
}

// Track affiliate click
export async function trackAffiliateClick(
  userId: string | null,
  clickType: 'bank_deal' | 'affiliate_product',
  referenceId: string,
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<AffiliateClick> {
  const supabase = createClient()
  
  const clickData: AffiliateClickInsert = {
    user_id: userId,
    click_type: clickType,
    ip_address: metadata.ipAddress || null,
    user_agent: metadata.userAgent || null,
    referrer: metadata.referrer || null,
    converted: false,
    commission_earned: 0
  }

  // Set the appropriate reference ID based on click type
  if (clickType === 'bank_deal') {
    clickData.deal_id = referenceId
  } else {
    clickData.product_id = referenceId
  }

  const { data, error } = await supabase
    .from('affiliate_clicks')
    .insert(clickData)
    .select()
    .single()

  if (error) {
    console.error('Error tracking affiliate click:', error)
    throw new Error(`Failed to track click: ${error.message}`)
  }

  return data as AffiliateClick
}

// Get user's affiliate clicks with details
export async function getAffiliateClicks(userId: string): Promise<AffiliateClick[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select(`
      *,
      bank_deals:deal_id (
        id,
        bank_name,
        reward_amount,
        affiliate_url,
        affiliate_provider,
        affiliate_commission
      ),
      affiliate_products:product_id (
        id,
        product_name,
        provider_name,
        product_type,
        affiliate_url,
        affiliate_provider,
        affiliate_commission
      )
    `)
    .eq('user_id', userId)
    .order('clicked_at', { ascending: false })

  if (error) {
    console.error('Error fetching affiliate clicks:', error)
    throw new Error(`Failed to fetch clicks: ${error.message}`)
  }

  return data as AffiliateClick[]
}

// Get total affiliate revenue (admin function)
export async function getTotalAffiliateRevenue(): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('commission_earned')
    .eq('converted', true)

  if (error) {
    console.error('Error fetching total revenue:', error)
    throw new Error(`Failed to fetch revenue: ${error.message}`)
  }

  const totalRevenue = data?.reduce((sum, click) => sum + (click.commission_earned || 0), 0) || 0
  return totalRevenue
}

// Get affiliate stats for user or platform-wide
export async function getAffiliateStats(userId?: string): Promise<AffiliateStats> {
  const supabase = createClient()
  
  let query = supabase
    .from('affiliate_clicks')
    .select('*')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching affiliate stats:', error)
    throw new Error(`Failed to fetch stats: ${error.message}`)
  }

  const clicks = data || []
  
  const stats: AffiliateStats = {
    totalClicks: clicks.length,
    totalConversions: clicks.filter(c => c.converted).length,
    totalRevenue: clicks.filter(c => c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0),
    bankDealClicks: clicks.filter(c => c.click_type === 'bank_deal').length,
    productClicks: clicks.filter(c => c.click_type === 'affiliate_product').length,
    bankDealConversions: clicks.filter(c => c.click_type === 'bank_deal' && c.converted).length,
    productConversions: clicks.filter(c => c.click_type === 'affiliate_product' && c.converted).length,
    bankDealRevenue: clicks.filter(c => c.click_type === 'bank_deal' && c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0),
    productRevenue: clicks.filter(c => c.click_type === 'affiliate_product' && c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0)
  }

  return stats
}

// Mark click as converted (when user actually signs up)
export async function markClickAsConverted(
  clickId: string,
  commissionEarned: number
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('affiliate_clicks')
    .update({
      converted: true,
      conversion_date: new Date().toISOString(),
      commission_earned: commissionEarned
    })
    .eq('id', clickId)

  if (error) {
    console.error('Error marking click as converted:', error)
    throw new Error(`Failed to mark conversion: ${error.message}`)
  }
}

// Get recent clicks for dashboard
export async function getRecentAffiliateClicks(userId: string, limit: number = 5): Promise<AffiliateClick[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select(`
      *,
      bank_deals:deal_id (
        id,
        bank_name,
        affiliate_provider
      ),
      affiliate_products:product_id (
        id,
        product_name,
        provider_name,
        affiliate_provider
      )
    `)
    .eq('user_id', userId)
    .order('clicked_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent clicks:', error)
    throw new Error(`Failed to fetch recent clicks: ${error.message}`)
  }

  return data as AffiliateClick[]
}
