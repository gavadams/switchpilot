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
