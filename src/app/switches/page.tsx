'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database } from '../../types/supabase'
import { getUserSwitchesSimple, getSwitchSteps } from '../../lib/supabase/switches'
import SwitchCard from '../../components/features/switches/SwitchCard'
import { AlertCircle, Loader2, Plus, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
  } | null
}

type SwitchStep = Database['public']['Tables']['switch_steps']['Row']

type StatusFilter = 'all' | 'started' | 'in_progress' | 'waiting' | 'completed' | 'failed'

export default function SwitchesPage() {
  const { user, loading: authLoading } = useAuth()
  
  const [switches, setSwitches] = useState<UserSwitch[]>([])
  const [switchSteps, setSwitchSteps] = useState<Record<string, SwitchStep[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'started_at' | 'progress' | 'reward_amount'>('started_at')
  const [retryCount, setRetryCount] = useState(0)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const fetchSwitches = async () => {
      
      if (!user) {
        if (!authLoading) {
          setLoading(false)
        }
        return
      }

      if (authLoading) {
        return
      }

      
      try {
        setLoading(true)
        setError(null)
        
        const switchesData = await getUserSwitchesSimple(user.id)
        setSwitches(switchesData)

        // Fetch steps for each switch
        if (switchesData.length > 0) {
          const stepsPromises = switchesData.map(async (switchItem) => {
            const steps = await getSwitchSteps(switchItem.id)
            return { switchId: switchItem.id, steps }
          })

          const stepsResults = await Promise.all(stepsPromises)
          const stepsMap: Record<string, SwitchStep[]> = {}
          stepsResults.forEach(({ switchId, steps }) => {
            stepsMap[switchId] = steps
          })
          setSwitchSteps(stepsMap)
        } else {
          setSwitchSteps({})
        }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load switches'
            setError(errorMessage)
            
            // Auto-retry for timeout errors
            if (errorMessage.includes('timeout') && retryCount < 3) {
              setIsRetrying(true)
              setTimeout(() => {
                setRetryCount(prev => prev + 1)
                setIsRetrying(false)
              }, 1000) // Wait 1 second before retry
            }
          } finally {
            setLoading(false)
            setHasInitiallyLoaded(true)
          }
    }

    fetchSwitches()
  }, [user?.id, authLoading, retryCount])

  const handleRefresh = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleForceRefresh = () => {
    window.location.reload()
  }

  // Force refresh when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !authLoading && hasInitiallyLoaded) {
        // Force a complete page refresh to bypass connection issues
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, authLoading, hasInitiallyLoaded])

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    if (loading && !authLoading) {
      const timeout = setTimeout(() => {
        setLoading(false)
        setError('Loading timeout - please try refreshing')
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [loading, authLoading])

  const filteredAndSortedSwitches = switches
    .filter(switchItem => {
      if (statusFilter === 'all') return true
      return switchItem.status === statusFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'started_at':
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        case 'progress':
          const aSteps = switchSteps[a.id] || []
          const bSteps = switchSteps[b.id] || []
          const aProgress = aSteps.filter(step => step.completed).length / Math.max(aSteps.length, 1)
          const bProgress = bSteps.filter(step => step.completed).length / Math.max(bSteps.length, 1)
          return bProgress - aProgress
        case 'reward_amount':
          return (b.bank_deals?.reward_amount || 0) - (a.bank_deals?.reward_amount || 0)
        default:
          return 0
      }
    })

      if (authLoading || loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading your switches...</p>
              {authLoading && <p className="text-sm text-neutral-500 mt-2">Authenticating...</p>}
              {loading && !authLoading && <p className="text-sm text-neutral-500 mt-2">Fetching data...</p>}
              {isRetrying && <p className="text-sm text-orange-500 mt-2">Connection timeout - retrying...</p>}
          
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
            My Bank Switches
          </h1>
        </div>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">Failed to load switches</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleRefresh} 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Retry
              </button>
              <button 
                onClick={handleForceRefresh} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Force Refresh
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            My Bank Switches
          </h1>
          <button
            onClick={handleRefresh}
            className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Refresh switches"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Track your bank switching progress and manage your active switches
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">{switches.length}</div>
            <p className="text-sm font-medium text-neutral-600">Total Switches</p>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {switches.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-sm font-medium text-neutral-600">Completed</p>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-accent-600 mb-2">
              {switches.filter(s => ['started', 'in_progress', 'waiting'].includes(s.status)).length}
            </div>
            <p className="text-sm font-medium text-neutral-600">Active</p>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-success-600 mb-2">
              £{switches.reduce((sum, s) => sum + (s.earnings_received || 0), 0)}
            </div>
            <p className="text-sm font-medium text-neutral-600">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="card-professional border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-neutral-700">Filter:</label>
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className="w-40 bg-white border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 shadow-lg">
                    <SelectItem value="all">All Switches</SelectItem>
                    <SelectItem value="started">Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-neutral-700">Sort by:</label>
                <Select value={sortBy} onValueChange={(value: 'started_at' | 'progress' | 'reward_amount') => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-white border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 shadow-lg">
                    <SelectItem value="started_at">Start Date</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="reward_amount">Reward Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Link href="/deals">
              <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start New Switch
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Switches Grid */}
      {filteredAndSortedSwitches.length === 0 ? (
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <ArrowRightLeft className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              {switches.length === 0 ? 'No switches yet' : 'No switches match your filter'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {switches.length === 0 
                ? 'Start your first bank switch to begin earning rewards!'
                : 'Try adjusting your filter to see more switches.'
              }
            </p>
            {switches.length === 0 && (
              <Link href="/deals">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Available Deals
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSwitches.map((switchItem) => (
            <SwitchCard
              key={switchItem.id}
              userSwitch={switchItem}
              steps={switchSteps[switchItem.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}