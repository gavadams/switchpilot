// Database table interfaces matching the SQL schema exactly

export interface Profile {
  id: string // UUID
  email: string
  full_name: string | null
  subscription_tier: 'free' | 'standard' | 'premium'
  total_earnings: number // DECIMAL(10,2)
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

// Insert types (without auto-generated fields)
export interface ProfileInsert {
  id: string
  email: string
  full_name?: string | null
  subscription_tier?: 'free' | 'standard' | 'premium'
  total_earnings?: number
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

// Update types (all fields optional except id)
export interface ProfileUpdate {
  id: string
  email?: string
  full_name?: string | null
  subscription_tier?: 'free' | 'standard' | 'premium'
  total_earnings?: number
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
