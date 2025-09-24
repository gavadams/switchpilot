import { createClient } from './client'
import { Database } from '../../types/supabase'
import { createSwitchSteps } from './switches'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']
type UserSwitch = Database['public']['Tables']['user_switches']['Row']
type UserSwitchInsert = Database['public']['Tables']['user_switches']['Insert']

// Client-side functions
export const getAllActiveDeals = async (): Promise<BankDeal[]> => {
  const supabase = createClient()
  
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

export const getDealById = async (id: string): Promise<BankDeal | null> => {
  const supabase = createClient()
  
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

export const createUserSwitch = async (
  userId: string, 
  dealId: string
): Promise<UserSwitch> => {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Authentication error:', authError)
    throw new Error('User not authenticated')
  }
  
  if (user.id !== userId) {
    throw new Error('User ID mismatch')
  }
  
  const switchData: UserSwitchInsert = {
    user_id: userId,
    deal_id: dealId,
    status: 'started',
    burner_account_details: {},
    earnings_received: 0
  }

  console.log('Inserting user switch with data:', switchData)
  
  const { data, error } = await supabase
    .from('user_switches')
    .insert(switchData)
    .select()
    .single()

  if (error) {
    console.error('Error creating user switch:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Failed to create switch: ${error.message}`)
  }

  console.log('User switch created successfully:', data)
  
  // Create switch steps for the new switch
  try {
    console.log('Creating switch steps for switch:', data.id)
    await createSwitchSteps(data.id)
    console.log('Switch steps created successfully')
  } catch (stepError) {
    console.error('Error creating switch steps:', stepError)
    // Don't throw here - the switch was created successfully, steps can be created later
  }
  
  return data
}

export const checkExistingSwitch = async (
  userId: string, 
  dealId: string
): Promise<UserSwitch | null> => {
  console.log('checkExistingSwitch called with userId:', userId, 'dealId:', dealId)
  const supabase = createClient()
  
  console.log('Querying user_switches table...')
  const { data, error } = await supabase
    .from('user_switches')
    .select('*')
    .eq('user_id', userId)
    .eq('deal_id', dealId)
    .limit(1)

  console.log('Query result - data:', data, 'error:', error)

  if (error) {
    console.error('Error checking existing switch:', error)
    throw new Error(`Failed to check existing switch: ${error.message}`)
  }

  const result = data && data.length > 0 ? data[0] : null
  console.log('Returning result:', result)
  return result
}

