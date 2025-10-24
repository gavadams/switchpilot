// User types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

// Bank switching types
export interface BankSwitch {
  id: string
  user_id: string
  from_bank: string
  to_bank: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  reward_amount: number
  created_at: string
  completed_at?: string
}

// Deal types
export interface Deal {
  id: string
  bank_name: string
  reward_amount: number
  requirements: string[]
  valid_until: string
  is_active: boolean
  created_at: string
}

// Billing types - Direct debit subscriptions only (no tier-based subscriptions)

// Admin-specific types for affiliate management
export interface AdminBankDeal {
  id: string
  bank_name: string
  reward_amount: number
  requirements: Record<string, unknown>
  expiry_date: string | null
  is_active: boolean
  min_pay_in: number
  required_direct_debits: number
  debit_card_transactions: number
  time_to_payout: string
  description: string | null
  affiliate_url: string | null
  commission_rate: number
  tracking_enabled: boolean
  affiliate_provider: string | null
  created_at: string
  updated_at: string
}

export interface AdminProduct {
  id: string
  product_name: string
  provider_name: string
  product_type: 'credit_card' | 'savings_account' | 'loan' | 'mortgage' | 'insurance' | 'investment' | 'other'
  description: string | null
  affiliate_url: string
  affiliate_provider: string | null
  affiliate_commission: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AffiliatePerformance {
  id: string
  name: string
  type: 'bank_deal' | 'affiliate_product'
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
}

export interface DateRange {
  startDate: string | null
  endDate: string | null
}

export type DatePreset = 'last7days' | 'last30days' | 'last90days' | 'alltime' | 'custom'