import { createClient } from './client'
import { Database } from '../../types/supabase'
import { STANDARD_SWITCH_STEPS } from '../data/switch-steps'

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
  } | null
}

type SwitchStep = Database['public']['Tables']['switch_steps']['Row']

// Analytics interfaces
export interface UserEarnings {
  totalLifetime: number
  thisMonth: number
  lastMonth: number
  monthlyGrowth: number
  projectedEarnings: number
}

export interface SwitchStats {
  totalSwitches: number
  activeSwitches: number
  completedSwitches: number
  successRate: number
  averageEarnings: number
  averageTimeToCompletion: number
}

export interface RecentActivity {
  id: string
  type: 'switch_started' | 'step_completed' | 'reward_received' | 'deal_expired'
  title: string
  description: string
  timestamp: string
  switchId?: string
  bankName?: string
  amount?: number
}

export interface ActiveSwitch {
  id: string
  bankName: string
  rewardAmount: number
  progress: number
  daysRemaining: number
  nextAction: string
  startedAt: string
}

// Get total lifetime earnings for a user
export const getUserEarnings = async (userId: string): Promise<UserEarnings> => {
  const supabase = createClient()
  
  try {
    // Get all completed switches with earnings
    const { data: completedSwitches, error } = await supabase
      .from('user_switches')
      .select(`
        earnings_received,
        completed_at,
        bank_deals (
          reward_amount
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('earnings_received', 'is', null)

    if (error) {
      console.error('Error fetching user earnings:', error)
      throw new Error(`Failed to fetch earnings: ${error.message}`)
    }

    // Calculate total lifetime earnings
    const totalLifetime = completedSwitches?.reduce((sum, switch_) => 
      sum + (switch_.earnings_received || 0), 0) || 0

    // Get current month and last month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Calculate this month's earnings
    const thisMonthEarnings = completedSwitches?.filter(switch_ => {
      if (!switch_.completed_at) return false
      const completedDate = new Date(switch_.completed_at)
      return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
    }).reduce((sum, switch_) => sum + (switch_.earnings_received || 0), 0) || 0

    // Calculate last month's earnings
    const lastMonthEarnings = completedSwitches?.filter(switch_ => {
      if (!switch_.completed_at) return false
      const completedDate = new Date(switch_.completed_at)
      return completedDate.getMonth() === lastMonth && completedDate.getFullYear() === lastMonthYear
    }).reduce((sum, switch_) => sum + (switch_.earnings_received || 0), 0) || 0

    // Calculate monthly growth percentage
    const monthlyGrowth = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : thisMonthEarnings > 0 ? 100 : 0

    // Get projected earnings from active switches
    const projectedEarnings = await getProjectedEarnings(userId)

    return {
      totalLifetime,
      thisMonth: thisMonthEarnings,
      lastMonth: lastMonthEarnings,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      projectedEarnings
    }
  } catch (error) {
    console.error('Error in getUserEarnings:', error)
    throw error
  }
}

// Get monthly earnings for a specific month and year
export const getMonthlyEarnings = async (userId: string, month: number, year: number): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('user_switches')
      .select('earnings_received, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('earnings_received', 'is', null)

    if (error) {
      console.error('Error fetching monthly earnings:', error)
      throw new Error(`Failed to fetch monthly earnings: ${error.message}`)
    }

    const monthlyEarnings = data?.filter(switch_ => {
      if (!switch_.completed_at) return false
      const completedDate = new Date(switch_.completed_at)
      return completedDate.getMonth() === month && completedDate.getFullYear() === year
    }).reduce((sum, switch_) => sum + (switch_.earnings_received || 0), 0) || 0

    return monthlyEarnings
  } catch (error) {
    console.error('Error in getMonthlyEarnings:', error)
    throw error
  }
}

// Get count of active (non-completed) switches
export const getActiveSwitchesCount = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['started', 'in_progress', 'waiting'])

    if (error) {
      console.error('Error fetching active switches count:', error)
      throw new Error(`Failed to fetch active switches count: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error('Error in getActiveSwitchesCount:', error)
    throw error
  }
}

// Get count of completed switches
export const getCompletedSwitchesCount = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { count, error } = await supabase
      .from('user_switches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) {
      console.error('Error fetching completed switches count:', error)
      throw new Error(`Failed to fetch completed switches count: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error('Error in getCompletedSwitchesCount:', error)
    throw error
  }
}

// Get recent activity for a user
export const getRecentActivity = async (userId: string, limit: number = 10): Promise<RecentActivity[]> => {
  const supabase = createClient()
  
  try {
    // Get recent switches with their steps
    const { data: switches, error: switchesError } = await supabase
      .from('user_switches')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        earnings_received,
        bank_deals (
          bank_name,
          reward_amount,
          expiry_date
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (switchesError) {
      console.error('Error fetching switches for activity:', switchesError)
      throw new Error(`Failed to fetch switches: ${switchesError.message}`)
    }

    // Get recent step completions
    const { data: steps, error: stepsError } = await supabase
      .from('switch_steps')
      .select(`
        id,
        switch_id,
        step_name,
        completed_at,
        user_switches!inner (
          user_id,
          bank_deals (
            bank_name
          )
        )
      `)
      .eq('user_switches.user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (stepsError) {
      console.error('Error fetching steps for activity:', stepsError)
      throw new Error(`Failed to fetch steps: ${stepsError.message}`)
    }

    const activities: RecentActivity[] = []

    // Add switch activities
    switches?.forEach(switch_ => {
      if (switch_.started_at) {
        activities.push({
          id: `switch-${switch_.id}`,
          type: 'switch_started',
          title: 'Switch Started',
          description: `Started switching to ${switch_.bank_deals?.bank_name || 'Unknown Bank'}`,
          timestamp: switch_.started_at,
          switchId: switch_.id,
          bankName: switch_.bank_deals?.bank_name
        })
      }

      if (switch_.completed_at && switch_.earnings_received) {
        activities.push({
          id: `reward-${switch_.id}`,
          type: 'reward_received',
          title: 'Reward Received',
          description: `Received £${switch_.earnings_received} from ${switch_.bank_deals?.bank_name || 'Unknown Bank'}`,
          timestamp: switch_.completed_at,
          switchId: switch_.id,
          bankName: switch_.bank_deals?.bank_name,
          amount: switch_.earnings_received
        })
      }
    })

    // Add step completion activities
    steps?.forEach(step => {
      activities.push({
        id: `step-${step.id}`,
        type: 'step_completed',
        title: 'Step Completed',
        description: `Completed: ${step.step_name}`,
        timestamp: step.completed_at!,
        switchId: step.switch_id,
        bankName: step.user_switches?.bank_deals?.bank_name
      })
    })

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    throw error
  }
}

// Get projected earnings from active switches
export const getProjectedEarnings = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('user_switches')
      .select(`
        bank_deals (
          reward_amount
        )
      `)
      .eq('user_id', userId)
      .in('status', ['started', 'in_progress', 'waiting'])

    if (error) {
      console.error('Error fetching projected earnings:', error)
      throw new Error(`Failed to fetch projected earnings: ${error.message}`)
    }

    const projectedEarnings = data?.reduce((sum, switch_) => 
      sum + ((switch_.bank_deals?.reward_amount as number) || 0), 0) || 0

    return projectedEarnings
  } catch (error) {
    console.error('Error in getProjectedEarnings:', error)
    throw error
  }
}

// Get average time to completion for a user
export const getAverageTimeToCompletion = async (userId: string): Promise<number> => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('user_switches')
      .select('started_at, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)

    if (error) {
      console.error('Error fetching completion times:', error)
      throw new Error(`Failed to fetch completion times: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return 0
    }

    const totalDays = data.reduce((sum, switch_) => {
      const startDate = new Date(switch_.started_at)
      const endDate = new Date(switch_.completed_at!)
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return sum + diffDays
    }, 0)

    return Math.round(totalDays / data.length)
  } catch (error) {
    console.error('Error in getAverageTimeToCompletion:', error)
    throw error
  }
}

// Get comprehensive switch stats for a user
export const getSwitchStats = async (userId: string): Promise<SwitchStats> => {
  const supabase = createClient()
  
  try {
    // Get all switches
    const { data: switches, error } = await supabase
      .from('user_switches')
      .select(`
        status,
        earnings_received,
        started_at,
        completed_at
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching switch stats:', error)
      throw new Error(`Failed to fetch switch stats: ${error.message}`)
    }

    const totalSwitches = switches?.length || 0
    const activeSwitches = switches?.filter(s => ['started', 'in_progress', 'waiting'].includes(s.status)).length || 0
    const completedSwitches = switches?.filter(s => s.status === 'completed').length || 0
    const successRate = totalSwitches > 0 ? Math.round((completedSwitches / totalSwitches) * 100) : 0

    // Calculate average earnings
    const totalEarnings = switches?.reduce((sum, s) => sum + (s.earnings_received || 0), 0) || 0
    const averageEarnings = completedSwitches > 0 ? Math.round((totalEarnings / completedSwitches) * 100) / 100 : 0

    // Calculate average time to completion
    const averageTimeToCompletion = await getAverageTimeToCompletion(userId)

    return {
      totalSwitches,
      activeSwitches,
      completedSwitches,
      successRate,
      averageEarnings,
      averageTimeToCompletion
    }
  } catch (error) {
    console.error('Error in getSwitchStats:', error)
    throw error
  }
}

// Get active switches with progress information
export const getActiveSwitches = async (userId: string, limit: number = 3): Promise<ActiveSwitch[]> => {
  const supabase = createClient()
  
  try {
    const { data: switches, error } = await supabase
      .from('user_switches')
      .select(`
        id,
        started_at,
        bank_deals (
          bank_name,
          reward_amount
        )
      `)
      .eq('user_id', userId)
      .in('status', ['started', 'in_progress', 'waiting'])
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching active switches:', error)
      throw new Error(`Failed to fetch active switches: ${error.message}`)
    }

    const activeSwitches: ActiveSwitch[] = []

    for (const switch_ of switches || []) {
      // Get steps for this switch to calculate progress
      const { data: steps, error: stepsError } = await supabase
        .from('switch_steps')
        .select('completed')
        .eq('switch_id', switch_.id)

      if (stepsError) {
        console.error('Error fetching steps for switch:', stepsError)
        continue
      }

      const completedSteps = steps?.filter(s => s.completed).length || 0
      const totalSteps = steps?.length || 1
      const progress = Math.round((completedSteps / totalSteps) * 100)

      // Calculate days remaining based on actual step estimates
      const startDate = new Date(switch_.started_at)
      const currentDate = new Date()
      const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate total estimated days for all steps dynamically
      const totalEstimatedDays = STANDARD_SWITCH_STEPS.reduce((total, step) => total + step.estimatedDays, 0)
      const daysRemaining = Math.max(0, totalEstimatedDays - daysElapsed)

      // Determine next action based on progress
      let nextAction = 'Complete remaining steps'
      if (progress < 25) {
        nextAction = 'Set up new account'
      } else if (progress < 50) {
        nextAction = 'Transfer direct debits'
      } else if (progress < 75) {
        nextAction = 'Close old account'
      } else {
        nextAction = 'Final verification'
      }

      activeSwitches.push({
        id: switch_.id,
        bankName: switch_.bank_deals?.bank_name || 'Unknown Bank',
        rewardAmount: (switch_.bank_deals?.reward_amount as number) || 0,
        progress,
        daysRemaining,
        nextAction,
        startedAt: switch_.started_at
      })
    }

    return activeSwitches
  } catch (error) {
    console.error('Error in getActiveSwitches:', error)
    throw error
  }
}

