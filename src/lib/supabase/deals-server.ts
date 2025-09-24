import { createServerSupabaseClient } from './server'
import { Database } from '../../types/supabase'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']
type UserSwitch = Database['public']['Tables']['user_switches']['Row']
type UserSwitchInsert = Database['public']['Tables']['user_switches']['Insert']

// Server-side functions for use in Server Components
export const getAllActiveDealsServer = async (): Promise<BankDeal[]> => {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .select('*')
    .eq('is_active', true)
    .order('reward_amount', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
    throw new Error(`Failed to fetch deals: ${error.message}`)
  }

  // Filter out expired deals
  const now = new Date()
  const activeDeals = (data || []).filter(deal => {
    // If no expiry date, deal is still active
    if (!deal.expiry_date) return true
    
    // Check if expiry date is in the future
    const expiryDate = new Date(deal.expiry_date)
    return expiryDate > now
  })

  return activeDeals
}

export const getDealByIdServer = async (id: string): Promise<BankDeal | null> => {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('bank_deals')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching deal:', error)
    throw new Error(`Failed to fetch deal: ${error.message}`)
  }

  // Check if deal is expired
  if (data && data.expiry_date) {
    const now = new Date()
    const expiryDate = new Date(data.expiry_date)
    if (expiryDate <= now) {
      return null // Deal is expired
    }
  }

  return data
}

export const createUserSwitchServer = async (
  userId: string, 
  dealId: string
): Promise<UserSwitch> => {
  const supabase = await createServerSupabaseClient()
  
  const switchData: UserSwitchInsert = {
    user_id: userId,
    deal_id: dealId,
    status: 'started',
    burner_account_details: {},
    earnings_received: 0
  }

  const { data, error } = await supabase
    .from('user_switches')
    .insert(switchData)
    .select()
    .single()

  if (error) {
    console.error('Error creating user switch:', error)
    throw new Error(`Failed to create switch: ${error.message}`)
  }

  return data
}
