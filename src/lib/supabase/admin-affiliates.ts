import { createClient } from './client'
import { Database } from '../../types/supabase'

type AffiliateClick = Database['public']['Tables']['affiliate_clicks']['Row']

type BankDeal = Database['public']['Tables']['bank_deals']['Row']
type AffiliateProduct = Database['public']['Tables']['affiliate_products']['Row']

// Bank deal affiliate management
export async function addBankDealAffiliate(dealId: string, affiliateData: {
  affiliate_url: string
  affiliate_provider: string
  affiliate_commission: number
  affiliate_commission_type: string
  affiliate_notes?: string
}): Promise<BankDeal> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .update({
      affiliate_url: affiliateData.affiliate_url,
      affiliate_provider: affiliateData.affiliate_provider,
      commission_rate: affiliateData.affiliate_commission,
      tracking_enabled: true,
      // Store additional data in a JSON field if needed
      requirements: {
        affiliate_commission_type: affiliateData.affiliate_commission_type,
        affiliate_notes: affiliateData.affiliate_notes
      }
    })
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('Error adding bank deal affiliate:', error)
    throw new Error(`Failed to add affiliate link: ${error.message}`)
  }

  return data
}

export async function removeBankDealAffiliate(dealId: string): Promise<BankDeal> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .update({
      affiliate_url: null,
      affiliate_provider: null,
      commission_rate: 0,
      tracking_enabled: false
    })
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('Error removing bank deal affiliate:', error)
    throw new Error(`Failed to remove affiliate link: ${error.message}`)
  }

  return data
}

export async function updateBankDealAffiliate(dealId: string, updates: {
  affiliate_url?: string
  affiliate_provider?: string
  commission_rate?: number
  tracking_enabled?: boolean
}): Promise<BankDeal> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .update(updates)
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('Error updating bank deal affiliate:', error)
    throw new Error(`Failed to update affiliate link: ${error.message}`)
  }

  return data
}

// Product affiliate management
export async function createAffiliateProduct(productData: {
  product_type: string
  provider_name: string
  product_name: string
  description: string
  key_features: string[]
  affiliate_url: string
  affiliate_provider: string
  affiliate_commission: number
  commission_type: string
  image_url?: string
  is_active: boolean
}): Promise<AffiliateProduct> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .insert({
      product_type: productData.product_type,
      provider_name: productData.provider_name,
      product_name: productData.product_name,
      description: productData.description,
      key_features: productData.key_features,
      affiliate_url: productData.affiliate_url,
      affiliate_provider: productData.affiliate_provider,
      affiliate_commission: productData.affiliate_commission,
      commission_type: productData.commission_type,
      image_url: productData.image_url,
      is_active: productData.is_active
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating affiliate product:', error)
    throw new Error(`Failed to create product: ${error.message}`)
  }

  return data
}

export async function updateAffiliateProduct(productId: string, updates: {
  product_type?: string
  provider_name?: string
  product_name?: string
  description?: string
  key_features?: string[]
  affiliate_url?: string
  affiliate_provider?: string
  affiliate_commission?: number
  commission_type?: string
  image_url?: string
  is_active?: boolean
}): Promise<AffiliateProduct> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating affiliate product:', error)
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return data
}

export async function deleteAffiliateProduct(productId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('affiliate_products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting affiliate product:', error)
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  return true
}

export async function toggleProductStatus(productId: string, isActive: boolean): Promise<AffiliateProduct> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling product status:', error)
    throw new Error(`Failed to toggle product status: ${error.message}`)
  }

  return data
}

export async function bulkUpdateProducts(productIds: string[], updates: {
  is_active?: boolean
  affiliate_provider?: string
  commission_type?: string
}): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .update(updates)
    .in('id', productIds)
    .select()

  if (error) {
    console.error('Error bulk updating products:', error)
    throw new Error(`Failed to bulk update products: ${error.message}`)
  }

  return data?.length || 0
}

// Performance tracking
export async function getAffiliatePerformance(affiliateId: string, type: 'bank_deal' | 'product'): Promise<{
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalRevenue: number
  recentClicks: AffiliateClick[]
}> {
  const supabase = createClient()
  
  // Get clicks for this affiliate
  const { data: clicks, error } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq(type === 'bank_deal' ? 'deal_id' : 'product_id', affiliateId)
    .order('clicked_at', { ascending: false })

  if (error) {
    console.error('Error fetching affiliate performance:', error)
    throw new Error(`Failed to fetch performance data: ${error.message}`)
  }

  const totalClicks = clicks?.length || 0
  const totalConversions = clicks?.filter(c => c.converted).length || 0
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const totalRevenue = clicks?.filter(c => c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0) || 0

  return {
    totalClicks,
    totalConversions,
    conversionRate,
    totalRevenue,
    recentClicks: clicks?.slice(0, 10) || []
  }
}

export async function getTopPerformingAffiliates(limit: number = 10): Promise<{
  bankDeals: Array<BankDeal & { performance: { totalClicks: number; totalConversions: number; totalRevenue: number } }>
  products: Array<AffiliateProduct & { performance: { totalClicks: number; totalConversions: number; totalRevenue: number } }>
}> {
  const supabase = createClient()
  
  // Get top performing bank deals
  const { data: bankDeals, error: bankError } = await supabase
    .from('bank_deals')
    .select(`
      *,
      affiliate_clicks!inner (
        id,
        converted,
        commission_earned
      )
    `)
    .eq('tracking_enabled', true)
    .limit(limit)

  // Get top performing products
  const { data: products, error: productError } = await supabase
    .from('affiliate_products')
    .select(`
      *,
      affiliate_clicks!inner (
        id,
        converted,
        commission_earned
      )
    `)
    .eq('is_active', true)
    .limit(limit)

  if (bankError || productError) {
    console.error('Error fetching top performing affiliates:', bankError || productError)
    throw new Error(`Failed to fetch top performing affiliates: ${(bankError || productError)?.message}`)
  }

  // Calculate performance metrics
  const bankDealsWithPerformance = bankDeals?.map(deal => {
    const clicks = (deal as BankDeal & { affiliate_clicks?: Array<{ converted: boolean; commission_earned: number }> }).affiliate_clicks || []
    return {
      ...deal,
      performance: {
        totalClicks: clicks.length,
        totalConversions: clicks.filter(c => c.converted).length,
        totalRevenue: clicks.filter(c => c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0)
      }
    }
  }) || []

  const productsWithPerformance = products?.map(product => {
    const clicks = (product as AffiliateProduct & { affiliate_clicks?: Array<{ converted: boolean; commission_earned: number }> }).affiliate_clicks || []
    return {
      ...product,
      performance: {
        totalClicks: clicks.length,
        totalConversions: clicks.filter(c => c.converted).length,
        totalRevenue: clicks.filter(c => c.converted).reduce((sum, c) => sum + (c.commission_earned || 0), 0)
      }
    }
  }) || []

  return {
    bankDeals: bankDealsWithPerformance,
    products: productsWithPerformance
  }
}

// Get all bank deals with affiliate info
export async function getAllBankDealsWithAffiliates(): Promise<BankDeal[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .select('*')
    .order('bank_name', { ascending: true })

  if (error) {
    console.error('Error fetching bank deals:', error)
    throw new Error(`Failed to fetch bank deals: ${error.message}`)
  }

  return data || []
}

// Get all affiliate products
export async function getAllAffiliateProducts(): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .order('product_name', { ascending: true })

  if (error) {
    console.error('Error fetching affiliate products:', error)
    throw new Error(`Failed to fetch affiliate products: ${error.message}`)
  }

  return data || []
}
