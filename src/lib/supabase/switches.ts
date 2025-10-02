import { createClient } from './client'
import { Database } from '../../types/supabase'
import { STANDARD_SWITCH_STEPS } from '../data/switch-steps'

// Create a fresh client instance for each request to avoid connection pooling issues
const createFreshClient = () => {
  return createClient()
}

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
    required_direct_debits: number
  } | null
}
type UserSwitchUpdate = Database['public']['Tables']['user_switches']['Update']
type SwitchStep = Database['public']['Tables']['switch_steps']['Row']
type SwitchStepInsert = Database['public']['Tables']['switch_steps']['Insert']
type SwitchStepUpdate = Database['public']['Tables']['switch_steps']['Update']

// Get all switches for a user
export const getUserSwitches = async (userId: string): Promise<UserSwitch[]> => {
  console.log('getUserSwitches: Starting fetch for user:', userId)
  const supabase = createClient()
  
  try {
    console.log('getUserSwitches: Creating query...')
    const { data, error } = await supabase
      .from('user_switches')
      .select(`
        *,
        bank_deals (
          bank_name,
          reward_amount,
          expiry_date,
          time_to_payout,
          required_direct_debits
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    console.log('getUserSwitches: Query completed - data:', data?.length, 'error:', error)

    if (error) {
      console.error('Error fetching user switches:', error)
      throw new Error(`Failed to fetch switches: ${error.message}`)
    }

    console.log('getUserSwitches: Returning data:', data?.length || 0, 'switches')
    return data || []
  } catch (err) {
    console.error('getUserSwitches: Exception caught:', err)
    throw err
  }
}

// Simple version for testing - without joins
export const getUserSwitchesSimple = async (userId: string): Promise<UserSwitch[]> => {
  // Create completely fresh client for each request to avoid connection issues
  const supabase = createFreshClient()
  
  try {
    // Add a timeout to the query
    const queryPromise = supabase
      .from('user_switches')
      .select(`
        *,
        bank_deals (
          bank_name,
          reward_amount,
          expiry_date,
          time_to_payout,
          required_direct_debits
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000)
    })

    const result = await Promise.race([queryPromise, timeoutPromise])
    const queryResult = result as { data: UserSwitch[] | null; error: { message: string } | null } | Error
    const { data, error } = queryResult as { data: UserSwitch[] | null; error: { message: string } | null }

    if (error) {
      throw new Error(`Failed to fetch switches: ${error.message}`)
    }

    return data || []
  } catch (err) {
    throw err
  }
}

// Test basic Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  const supabase = createFreshClient()
  
  try {
    // Test with a timeout to avoid hanging
    const queryPromise = supabase
      .from('user_switches')
      .select('count')
      .limit(1)

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout')), 5000)
    })

    const result = await Promise.race([queryPromise, timeoutPromise])
    const queryResult = result as { data: { count: number }[] | null; error: { message: string } | null } | Error
    const { data, error } = queryResult as { data: { count: number }[] | null; error: { message: string } | null }
    
    return !error
  } catch (err) {
    return false
  }
}

// Get a specific switch by ID
export const getSwitchById = async (switchId: string): Promise<UserSwitch | null> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_switches')
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount,
        expiry_date,
        time_to_payout,
        required_direct_debits
      )
    `)
    .eq('id', switchId)
    .single()

  if (error) {
    console.error('Error fetching switch:', error)
    throw new Error(`Failed to fetch switch: ${error.message}`)
  }

  return data
}

// Get all steps for a switch
export const getSwitchSteps = async (switchId: string): Promise<SwitchStep[]> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('switch_steps')
    .select('*')
    .eq('switch_id', switchId)
    .order('step_number', { ascending: true })

  if (error) {
    console.error('Error fetching switch steps:', error)
    throw new Error(`Failed to fetch switch steps: ${error.message}`)
  }

  return data || []
}

// Create switch steps for a new switch
export const createSwitchSteps = async (switchId: string): Promise<SwitchStep[]> => {
  const supabase = createClient()
  
  const stepsToInsert: SwitchStepInsert[] = STANDARD_SWITCH_STEPS.map(step => ({
    switch_id: switchId,
    step_number: step.step_number,
    step_name: step.step_name,
    description: step.description,
    completed: false,
    due_date: null, // Will be calculated based on start date
    notes: null
  }))

  const { data, error } = await supabase
    .from('switch_steps')
    .insert(stepsToInsert)
    .select()

  if (error) {
    console.error('Error creating switch steps:', error)
    throw new Error(`Failed to create switch steps: ${error.message}`)
  }

  return data || []
}

// Update a switch step
export const updateSwitchStep = async (
  stepId: string, 
  updates: { completed?: boolean; notes?: string }
): Promise<SwitchStep> => {
  const supabase = createClient()
  
  // Filter out undefined values
  const updateData: SwitchStepUpdate = {}
  if (updates.completed !== undefined) {
    updateData.completed = updates.completed
    if (updates.completed) {
      updateData.completed_at = new Date().toISOString()
    }
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes
  }

  console.log('Updating switch step with data:', updateData, 'for step ID:', stepId)

  const { data, error } = await supabase
    .from('switch_steps')
    .update(updateData)
    .eq('id', stepId)
    .select()

  if (error) {
    console.error('Error updating switch step:', error)
    console.error('Update data:', updateData)
    console.error('Step ID:', stepId)
    throw new Error(`Failed to update switch step: ${error.message || 'Unknown error'}`)
  }

  if (!data || data.length === 0) {
    console.error('No rows updated for step ID:', stepId)
    throw new Error(`No switch step found with ID: ${stepId}`)
  }

  return data[0]
}

// Update switch status
export const updateSwitchStatus = async (
  switchId: string, 
  status: 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'
): Promise<UserSwitch> => {
  const supabase = createClient()
  
  const updateData: UserSwitchUpdate = {
    status,
    ...(status === 'completed' && { completed_at: new Date().toISOString() })
  }

  const { data, error } = await supabase
    .from('user_switches')
    .update(updateData)
    .eq('id', switchId)
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount,
        expiry_date,
        time_to_payout,
        required_direct_debits
      )
    `)
    .single()

  if (error) {
    console.error('Error updating switch status:', error)
    throw new Error(`Failed to update switch status: ${error.message}`)
  }

  return data
}

// Update switch notes
export const updateSwitchNotes = async (
  switchId: string, 
  notes: string
): Promise<UserSwitch> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_switches')
    .update({ notes })
    .eq('id', switchId)
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount,
        expiry_date,
        time_to_payout,
        required_direct_debits
      )
    `)
    .single()

  if (error) {
    console.error('Error updating switch notes:', error)
    throw new Error(`Failed to update switch notes: ${error.message}`)
  }

  return data
}

// Update earnings received when bank pays out
export const updateEarningsReceived = async (
  switchId: string, 
  earningsReceived: number
): Promise<UserSwitch> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_switches')
    .update({ earnings_received: earningsReceived })
    .eq('id', switchId)
    .select(`
      *,
      bank_deals (
        bank_name,
        reward_amount,
        expiry_date,
        time_to_payout,
        required_direct_debits
      )
    `)
    .single()

  if (error) {
    console.error('Error updating earnings received:', error)
    throw new Error(`Failed to update earnings received: ${error.message}`)
  }

  return data
}

// Calculate switch progress
export const calculateSwitchProgress = (steps: SwitchStep[]): {
  completedSteps: number
  totalSteps: number
  progressPercentage: number
  currentStep: SwitchStep | null
  nextStep: SwitchStep | null
} => {
  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  
  const currentStep = steps.find(step => !step.completed) || null
  const nextStep = currentStep || null

  return {
    completedSteps,
    totalSteps,
    progressPercentage,
    currentStep,
    nextStep
  }
}

// Calculate estimated completion date
export const calculateEstimatedCompletion = (
  startDate: string,
  steps: SwitchStep[]
): Date => {
  const start = new Date(startDate)
  const completedSteps = steps.filter(step => step.completed)
  const remainingSteps = steps.filter(step => !step.completed)
  
  // Add days for completed steps
  let totalDays = 0
  completedSteps.forEach(step => {
    totalDays += step.step_number <= 3 ? 1 : 1 // Use actual days for first 3 steps
  })
  
  // Add estimated days for remaining steps
  remainingSteps.forEach(step => {
    totalDays += 1 // Default 1 day per step
  })
  
  const completionDate = new Date(start)
  completionDate.setDate(completionDate.getDate() + totalDays)
  
  return completionDate
}
