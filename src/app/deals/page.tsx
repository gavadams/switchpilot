'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Database } from '../../types/supabase'
import { getAllActiveDeals } from '../../lib/supabase/deals'
import DealsGrid from '../../components/features/deals/DealsGrid'
import StartSwitchDialog from '../../components/features/deals/StartSwitchDialog'
import { AlertCircle, Loader2 } from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

// Prevent static generation during build
export const dynamic = 'force-dynamic'

export default function DealsPage() {
  const { loading: authLoading } = useAuth()
  const [deals, setDeals] = useState<BankDeal[]>([] as BankDeal[])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<BankDeal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        setError(null)
        const dealsData = await getAllActiveDeals()
        setDeals(dealsData as BankDeal[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchDeals()
    }
  }, [authLoading])

  const handleStartSwitch = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId)
    if (deal) {
      setSelectedDeal(deal)
      setDialogOpen(true)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading deals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
            Available Bank Switching Deals
          </h1>
        </div>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">Failed to load deals</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
          Available Bank Switching Deals
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Discover the best bank switching offers and maximize your rewards. Find deals that match your needs and start earning today.
        </p>
      </div>

      {/* Commission Disclosure */}
      <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 border border-neutral-200 rounded-lg p-4 max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-neutral-600">
                <strong>Commission Disclosure:</strong> SwitchPilot may earn a commission when you apply for bank deals through our platform. This helps us provide our free service and doesn&apos;t affect the rewards you receive from the banks.
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">{deals.length}</div>
            <p className="text-sm font-medium text-neutral-600">Available Deals</p>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              £{Math.max(...deals.map(d => (d.reward_amount as number) || 0), 0)}
            </div>
            <p className="text-sm font-medium text-neutral-600">Highest Reward</p>
          </CardContent>
        </Card>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center p-6">
            <div className="text-3xl font-bold text-accent-600 mb-2">
              £{Math.round(deals.reduce((sum, d) => sum + ((d.reward_amount as number) || 0), 0) / deals.length) || 0}
            </div>
            <p className="text-sm font-medium text-neutral-600">Average Reward</p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Grid */}
      <DealsGrid 
        deals={deals} 
        onStartSwitch={handleStartSwitch}
        loading={loading}
      />

      {/* Start Switch Dialog */}
      <StartSwitchDialog
        deal={selectedDeal}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}