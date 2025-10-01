import { createClient } from './client'
import { Database } from '../../types/supabase'

type DirectDebit = Database['public']['Tables']['direct_debits']['Row']
type DirectDebitInsert = Database['public']['Tables']['direct_debits']['Insert']
type DirectDebitUpdate = Database['public']['Tables']['direct_debits']['Update']

export interface CreateDDInput {
  switch_id?: string
  provider: string
  charity_name?: string
  amount: number
  frequency: 'monthly' | 'one-time'
  auto_cancel_after_switch?: boolean
  stripe_payment_method_id?: string
}

export interface DirectDebitWithProvider extends DirectDebit {
  provider_info?: {
    name: string
    description: string
    website: string
    category: string
  }
}

// Get all direct debits for a user
export const getUserDirectDebits = async (userId: string): Promise<DirectDebitWithProvider[]> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user direct debits:', error)
      throw new Error(`Failed to fetch direct debits: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserDirectDebits:', error)
    throw error
  }
}

// Create a new direct debit
export const createDirectDebit = async (data: CreateDDInput & { user_id: string }): Promise<DirectDebit> => {
  const supabase = createClient()
  
  try {
    const insertData: DirectDebitInsert = {
      user_id: data.user_id,
      switch_id: data.switch_id,
      provider: data.provider,
      charity_name: data.charity_name,
      amount: data.amount,
      frequency: data.frequency,
      status: 'pending',
      setup_date: new Date().toISOString().split('T')[0],
      next_collection_date: data.frequency === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      auto_cancel_after_switch: data.auto_cancel_after_switch ?? true,
      stripe_payment_method_id: data.stripe_payment_method_id
    }

    const { data: result, error } = await supabase
      .from('direct_debits')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating direct debit:', error)
      throw new Error(`Failed to create direct debit: ${error.message}`)
    }

    return result
  } catch (error) {
    console.error('Error in createDirectDebit:', error)
    throw error
  }
}

// Update direct debit status
export const updateDirectDebitStatus = async (ddId: string, status: string): Promise<DirectDebit> => {
  const supabase = createClient()
  
  try {
    const updateData: DirectDebitUpdate = {
      status: status as 'pending' | 'active' | 'cancelled' | 'failed',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('direct_debits')
      .update(updateData)
      .eq('id', ddId)
      .select()
      .single()

    if (error) {
      console.error('Error updating direct debit status:', error)
      throw new Error(`Failed to update direct debit status: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in updateDirectDebitStatus:', error)
    throw error
  }
}

// Cancel a direct debit
export const cancelDirectDebit = async (ddId: string): Promise<DirectDebit> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', ddId)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling direct debit:', error)
      throw new Error(`Failed to cancel direct debit: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in cancelDirectDebit:', error)
    throw error
  }
}

// Get count of active direct debits
export const getActiveDirectDebitsCount = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('direct_debits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) {
      console.error('Error counting active direct debits:', error)
      throw new Error(`Failed to count active direct debits: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error('Error in getActiveDirectDebitsCount:', error)
    throw error
  }
}

// Calculate monthly total for active direct debits
export const calculateMonthlyDDTotal = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('frequency', 'monthly')

    if (error) {
      console.error('Error calculating monthly DD total:', error)
      throw new Error(`Failed to calculate monthly DD total: ${error.message}`)
    }

    const total = (data || []).reduce((sum, dd) => sum + (dd.amount || 0), 0)
    return total
  } catch (error) {
    console.error('Error in calculateMonthlyDDTotal:', error)
    throw error
  }
}

// Get direct debit statistics
export const getDirectDebitStats = async (userId: string) => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .select('amount, frequency, status, total_collected, provider')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching DD stats:', error)
      throw new Error(`Failed to fetch DD stats: ${error.message}`)
    }

    const activeCount = data?.filter(dd => dd.status === 'active').length || 0
    const monthlyTotal = data?.filter(dd => dd.status === 'active' && dd.frequency === 'monthly')
      .reduce((sum, dd) => sum + (dd.amount || 0), 0) || 0
    const totalCollected = data?.reduce((sum, dd) => sum + (dd.total_collected || 0), 0) || 0

    // Revenue tracking for SwitchPilot DDs
    const switchPilotDDs = data?.filter(dd => dd.provider === 'switchpilot' && dd.status === 'active') || []
    const switchPilotRevenue = switchPilotDDs.reduce((sum, dd) => sum + (dd.amount || 0), 0)
    const switchPilotCount = switchPilotDDs.length

    return {
      activeCount,
      monthlyTotal,
      totalCollected,
      switchPilotRevenue,
      switchPilotCount
    }
  } catch (error) {
    console.error('Error in getDirectDebitStats:', error)
    throw error
  }
}

// Get DDs for a specific switch
export const getDirectDebitsForSwitch = async (switchId: string): Promise<DirectDebit[]> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .select('*')
      .eq('switch_id', switchId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching DDs for switch:', error)
      throw new Error(`Failed to fetch DDs for switch: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getDirectDebitsForSwitch:', error)
    throw error
  }
}

// Get revenue from SwitchPilot DDs
export const getSwitchPilotRevenue = async (userId: string) => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('direct_debits')
      .select('amount, status, total_collected')
      .eq('user_id', userId)
      .eq('provider', 'switchpilot')

    if (error) {
      console.error('Error fetching SwitchPilot revenue:', error)
      throw new Error(`Failed to fetch SwitchPilot revenue: ${error.message}`)
    }

    const activeRevenue = data?.filter(dd => dd.status === 'active')
      .reduce((sum, dd) => sum + (dd.amount || 0), 0) || 0
    const totalCollected = data?.reduce((sum, dd) => sum + (dd.total_collected || 0), 0) || 0

    return {
      activeRevenue,
      totalCollected,
      activeCount: data?.filter(dd => dd.status === 'active').length || 0
    }
  } catch (error) {
    console.error('Error in getSwitchPilotRevenue:', error)
    throw error
  }
}
