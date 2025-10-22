import { createClient } from './client'

// Types for affiliate products
export interface AffiliateProduct {
  id: string
  product_type: 'credit_card' | 'savings_account' | 'loan' | 'mortgage' | 'insurance' | 'investment' | 'other'
  provider_name: string
  product_name: string
  description: string | null
  key_features: Record<string, unknown> | null
  affiliate_url: string
  affiliate_provider: string | null
  affiliate_commission: number
  affiliate_commission_type: string
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface AffiliateProductInsert {
  product_type: 'credit_card' | 'savings_account' | 'loan' | 'mortgage' | 'insurance' | 'investment' | 'other'
  provider_name: string
  product_name: string
  description?: string | null
  key_features?: Record<string, unknown> | null
  affiliate_url: string
  affiliate_provider?: string | null
  affiliate_commission?: number
  affiliate_commission_type?: string
  is_active?: boolean
  image_url?: string | null
}

// Get all active affiliate products
export async function getAffiliateProducts(productType?: string): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .order('affiliate_commission', { ascending: false })

  if (productType && productType !== 'all') {
    query = query.eq('product_type', productType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching affiliate products:', error)
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return data as AffiliateProduct[]
}

// Get single product by ID
export async function getProductById(productId: string): Promise<AffiliateProduct | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data as AffiliateProduct | null
}

// Get featured products (top performers or highest commission)
export async function getFeaturedProducts(limit: number = 6): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .order('affiliate_commission', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    throw new Error(`Failed to fetch featured products: ${error.message}`)
  }

  return data as AffiliateProduct[]
}

// Get products by type for filtering
export async function getProductsByType(productType: string): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('product_type', productType)
    .eq('is_active', true)
    .order('affiliate_commission', { ascending: false })

  if (error) {
    console.error('Error fetching products by type:', error)
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return data as AffiliateProduct[]
}

// Search products by name or provider
export async function searchAffiliateProducts(searchTerm: string): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .or(`product_name.ilike.%${searchTerm}%,provider_name.ilike.%${searchTerm}%`)
    .order('affiliate_commission', { ascending: false })

  if (error) {
    console.error('Error searching products:', error)
    throw new Error(`Failed to search products: ${error.message}`)
  }

  return data as AffiliateProduct[]
}

// Get product types for filtering
export async function getProductTypes(): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('product_type')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching product types:', error)
    throw new Error(`Failed to fetch product types: ${error.message}`)
  }

  // Get unique product types
  const types = [...new Set(data?.map(item => item.product_type) || [])]
  return types.sort()
}

// Get products with affiliate provider info
export async function getProductsWithProviderInfo(): Promise<AffiliateProduct[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('is_active', true)
    .not('affiliate_provider', 'is', null)
    .order('affiliate_commission', { ascending: false })

  if (error) {
    console.error('Error fetching products with provider info:', error)
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return data as AffiliateProduct[]
}
