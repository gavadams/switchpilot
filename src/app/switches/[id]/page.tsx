'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Database } from '../../../types/supabase'
import { getSwitchById, getSwitchSteps, createSwitchSteps } from '../../../lib/supabase/switches'
import SwitchDetails from '../../../components/features/switches/SwitchDetails'
import { AlertCircle, Loader2 } from 'lucide-react'

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
    required_direct_debits: number
    affiliate_url: string | null
  } | null
}

type SwitchStep = Database['public']['Tables']['switch_steps']['Row']

// Prevent static generation during build
export const dynamic = 'force-dynamic'

export default function SwitchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [userSwitch, setUserSwitch] = useState<UserSwitch | null>(null)
  const [steps, setSteps] = useState<SwitchStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)

  const switchId = params.id as string

  useEffect(() => {
    const fetchSwitchData = async () => {
      if (!user || !switchId) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch switch details
        const switchData = await getSwitchById(switchId)
        if (!switchData) {
          setError('Switch not found')
          return
        }

        // Check if user owns this switch
        if (switchData.user_id !== user.id) {
          setError('Access denied')
          return
        }

        setUserSwitch(switchData)

        // Fetch switch steps
        let stepsData = await getSwitchSteps(switchId)
        
        // If no steps exist, create them
        if (stepsData.length === 0) {
          stepsData = await createSwitchSteps(switchId)
        }
        
        setSteps(stepsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load switch details')
      } finally {
        setLoading(false)
        setHasInitiallyLoaded(true)
      }
    }

    if (!authLoading) {
      fetchSwitchData()
    }
  }, [user, switchId, authLoading])

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

  const handleSwitchUpdate = async () => {
    if (!switchId) return

    try {
      // Refetch switch and steps data
      const switchData = await getSwitchById(switchId)
      const stepsData = await getSwitchSteps(switchId)
      
      if (switchData) setUserSwitch(switchData)
      setSteps(stepsData)
    } catch (error) {
      // Error refreshing data - could show a toast notification here
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading switch details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              {error === 'Switch not found' ? 'Switch Not Found' : 
               error === 'Access denied' ? 'Access Denied' : 'Error Loading Switch'}
            </h3>
            <p className="text-neutral-600 mb-4">
              {error === 'Switch not found' ? 'The switch you\'re looking for doesn\'t exist.' :
               error === 'Access denied' ? 'You don\'t have permission to view this switch.' :
               'There was an error loading the switch details.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/switches')} 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Back to Switches
              </button>
              <button 
                onClick={() => window.location.reload()} 
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

  if (!userSwitch) {
    return (
      <div className="space-y-8">
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Switch Data</h3>
            <p className="text-neutral-600 mb-4">Unable to load switch information.</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/switches')} 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Back to Switches
              </button>
              <button 
                onClick={() => window.location.reload()} 
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
    <SwitchDetails 
      userSwitch={userSwitch} 
      steps={steps} 
      onSwitchUpdate={handleSwitchUpdate}
    />
  )
}
