// Database table interfaces matching the SQL schema exactly

export interface Profile {
  id: string // UUID
  email: string
  full_name: string | null
  total_earnings: number // DECIMAL(10,2)
  is_admin?: boolean
  role?: 'user' | 'admin' | 'support'
  is_suspended?: boolean
  suspension_reason?: string | null
  suspended_until?: string | null
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface BankDeal {
  id: string // UUID
  bank_name: string
  reward_amount: number // DECIMAL(10,2)
  requirements: Record<string, unknown> // JSONB
  expiry_date: string | null // DATE
  is_active: boolean
  min_pay_in: number // DECIMAL(10,2)
  required_direct_debits: number
  debit_card_transactions: number
  time_to_payout: string
  affiliate_url: string | null // TEXT
  commission_rate: number // DECIMAL(5,2)
  tracking_enabled: boolean
  affiliate_provider: string | null // VARCHAR(50)
  source_name: string | null // VARCHAR
  source_priority: number // INTEGER
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface UserSwitch {
  id: string // UUID
  user_id: string // UUID
  deal_id: string // UUID
  status: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
  burner_account_details: Record<string, unknown> // JSONB
  started_at: string // TIMESTAMP WITH TIME ZONE
  completed_at: string | null // TIMESTAMP WITH TIME ZONE
  earnings_received: number // DECIMAL(10,2)
  notes: string | null // TEXT
}

export interface SwitchStep {
  id: string // UUID
  switch_id: string // UUID
  step_number: number
  step_name: string
  description: string | null // TEXT
  completed: boolean
  due_date: string | null // DATE
  completed_at: string | null // TIMESTAMP WITH TIME ZONE
}

export interface AffiliateClick {
  id: string // UUID
  user_id: string // UUID
  deal_id: string // UUID
  switch_id: string | null // UUID
  click_timestamp: string // TIMESTAMP WITH TIME ZONE
  ip_address: string | null // INET
  user_agent: string | null // TEXT
  referrer: string | null // TEXT
  conversion_timestamp: string | null // TIMESTAMP WITH TIME ZONE
  commission_earned: number // DECIMAL(10,2)
  status: 'clicked' | 'converted' | 'expired' | 'cancelled'
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface DirectDebit {
  id: string // UUID
  user_id: string // UUID
  switch_id: string | null // UUID
  provider: string
  charity_name: string | null
  amount: number // DECIMAL(10,2)
  frequency: 'monthly' | 'one-time'
  status: 'pending' | 'active' | 'cancelled' | 'completed' | 'failed'
  setup_date: string // DATE
  next_collection_date: string | null // DATE
  last_collection_date: string | null // DATE
  auto_cancel_after_switch: boolean
  total_collected: number // DECIMAL(10,2)
  stripe_payment_method_id: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface DdPayment {
  id: string // UUID
  user_id: string // UUID
  direct_debit_id: string // UUID
  amount: number // DECIMAL(10,2)
  payment_date: string // DATE
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  failure_reason: string | null
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface ScrapingSource {
  id: string // UUID
  name: string // VARCHAR
  url: string // VARCHAR
  is_active: boolean // BOOLEAN
  priority: number // INTEGER
  scraper_config: Record<string, unknown> // JSONB
  last_scraped_at: string | null // TIMESTAMP WITH TIME ZONE
  last_scrape_status: string | null // VARCHAR
  last_scrape_deals_found: number // INTEGER
  created_at: string // TIMESTAMP WITH TIME ZONE
  updated_at: string // TIMESTAMP WITH TIME ZONE
}

export interface ScrapingLog {
  id: string // UUID
  source_id: string | null // UUID
  source_name: string | null // VARCHAR
  deals_found: number // INTEGER
  deals_added: number // INTEGER
  deals_updated: number // INTEGER
  deals_deactivated: number // INTEGER
  status: string | null // VARCHAR
  error_message: string | null // TEXT
  duration_seconds: number | null // INTEGER
  scrape_data: Record<string, unknown> | null // JSONB
  created_at: string // TIMESTAMP WITH TIME ZONE
}

// Insert types (without auto-generated fields)
export interface ProfileInsert {
  id: string
  email: string
  full_name?: string | null
  total_earnings?: number
  is_admin?: boolean
  role?: 'user' | 'admin' | 'support'
  is_suspended?: boolean
  suspension_reason?: string | null
  suspended_until?: string | null
}

export interface BankDealInsert {
  bank_name: string
  reward_amount: number
  requirements?: Record<string, unknown>
  expiry_date?: string | null
  is_active?: boolean
  min_pay_in?: number
  required_direct_debits?: number
  debit_card_transactions?: number
  time_to_payout?: string
  affiliate_url?: string | null
  commission_rate?: number
  tracking_enabled?: boolean
  affiliate_provider?: string | null
  source_name?: string | null
  source_priority?: number
}

export interface UserSwitchInsert {
  user_id: string
  deal_id: string
  status?: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
  burner_account_details?: Record<string, unknown>
  earnings_received?: number
  notes?: string | null
}

export interface SwitchStepInsert {
  switch_id: string
  step_number: number
  step_name: string
  description?: string | null
  completed?: boolean
  due_date?: string | null
}

export interface AffiliateClickInsert {
  user_id: string
  deal_id: string
  switch_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  referrer?: string | null
  commission_earned?: number
  status?: 'clicked' | 'converted' | 'expired' | 'cancelled'
}

export interface ScrapingSourceInsert {
  name: string
  url: string
  is_active?: boolean
  priority?: number
  scraper_config: Record<string, unknown>
  last_scraped_at?: string | null
  last_scrape_status?: string | null
  last_scrape_deals_found?: number
}

export interface ScrapingLogInsert {
  source_id?: string | null
  source_name?: string | null
  deals_found?: number
  deals_added?: number
  deals_updated?: number
  deals_deactivated?: number
  status?: string | null
  error_message?: string | null
  duration_seconds?: number | null
  scrape_data?: Record<string, unknown> | null
}

// Update types (all fields optional except id)
export interface ProfileUpdate {
  id: string
  email?: string
  full_name?: string | null
  total_earnings?: number
  is_admin?: boolean
  role?: 'user' | 'admin' | 'support'
  is_suspended?: boolean
  suspension_reason?: string | null
  suspended_until?: string | null
}

export interface BankDealUpdate {
  id: string
  bank_name?: string
  reward_amount?: number
  requirements?: Record<string, unknown>
  expiry_date?: string | null
  is_active?: boolean
  min_pay_in?: number
  required_direct_debits?: number
  debit_card_transactions?: number
  time_to_payout?: string
  affiliate_url?: string | null
  commission_rate?: number
  tracking_enabled?: boolean
  affiliate_provider?: string | null
  source_name?: string | null
  source_priority?: number
}

export interface UserSwitchUpdate {
  id: string
  user_id?: string
  deal_id?: string
  status?: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
  burner_account_details?: Record<string, unknown>
  completed_at?: string | null
  earnings_received?: number
  notes?: string | null
}

export interface SwitchStepUpdate {
  id: string
  switch_id?: string
  step_number?: number
  step_name?: string
  description?: string | null
  completed?: boolean
  due_date?: string | null
  completed_at?: string | null
}

export interface AffiliateClickUpdate {
  id: string
  switch_id?: string | null
  conversion_timestamp?: string | null
  commission_earned?: number
  status?: 'clicked' | 'converted' | 'expired' | 'cancelled'
}

export interface ScrapingSourceUpdate {
  id: string
  name?: string
  url?: string
  is_active?: boolean
  priority?: number
  scraper_config?: Record<string, unknown>
  last_scraped_at?: string | null
  last_scrape_status?: string | null
  last_scrape_deals_found?: number
}

export interface ScrapingLogUpdate {
  id: string
  source_id?: string | null
  source_name?: string | null
  deals_found?: number
  deals_added?: number
  deals_updated?: number
  deals_deactivated?: number
  status?: string | null
  error_message?: string | null
  duration_seconds?: number | null
  scrape_data?: Record<string, unknown> | null
}

// Admin audit log types
export interface AdminAuditLog {
  id: string // UUID
  admin_id: string | null // UUID
  admin_email: string | null
  action_type: string
  target_type: string | null
  target_id: string | null // UUID
  target_email: string | null
  action_details: Record<string, unknown> | null // JSONB
  ip_address: string | null
  user_agent: string | null
  result: 'success' | 'failed'
  error_message: string | null
  created_at: string // TIMESTAMP WITH TIME ZONE
}

export interface AdminAuditLogInsert {
  admin_id?: string | null
  admin_email?: string | null
  action_type: string
  target_type?: string | null
  target_id?: string | null
  target_email?: string | null
  action_details?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  result?: 'success' | 'failed'
  error_message?: string | null
}

// Deal history types
export interface DealHistory {
  id: string // UUID
  deal_id: string // UUID
  changed_by: string | null // UUID
  change_type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  changes: Record<string, unknown> | null // JSONB
  created_at: string // TIMESTAMP WITH TIME ZONE
}

export interface DealHistoryInsert {
  deal_id: string
  changed_by?: string | null
  change_type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  changes?: Record<string, unknown> | null
}
