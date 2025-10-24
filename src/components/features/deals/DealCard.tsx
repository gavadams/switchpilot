'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '../../ui/toast'
import { Database } from '../../../types/supabase'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  Banknote, 
  Calendar, 
  CreditCard, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface DealCardProps {
  deal: BankDeal
  onStartSwitch: (dealId: string) => void
}

export default function DealCard({ deal, onStartSwitch }: DealCardProps) {
  // Helper function to safely extract and type values
  const getNumber = (value: unknown): number => Number(value) || 0
  const getString = (value: unknown): string => String(value) || ''
  const [isStarting, setIsStarting] = useState(false)
  const [isTrackingClick, setIsTrackingClick] = useState(false)
  const { addToast } = useToast()

  const handleStartSwitch = async () => {
    setIsStarting(true)
    try {
      await onStartSwitch((deal as BankDeal).id)
    } finally {
      setIsStarting(false)
    }
  }

  const handleAffiliateClick = async () => {
    if (!deal.affiliate_url) return

    setIsTrackingClick(true)
    try {
      // Track the click
      await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clickType: 'bank_deal',
          referenceId: deal.id
        })
      })

      // Show success toast
      addToast({
        title: "Click tracked!",
        description: "Opening application...",
        variant: "success",
        duration: 3000
      })

      // Open affiliate link in new tab
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error tracking affiliate click:', error)
      
      // Show error toast but still open the link
      addToast({
        title: "Tracking failed",
        description: "Opening application anyway...",
        variant: "warning",
        duration: 3000
      })
      
      // Still open the link even if tracking fails
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer')
    } finally {
      setIsTrackingClick(false)
    }
  }

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { text: 'Expired', color: 'destructive' as const }
    } else if (daysUntilExpiry <= 7) {
      return { text: `${daysUntilExpiry} days left`, color: 'destructive' as const }
    } else if (daysUntilExpiry <= 30) {
      return { text: `${daysUntilExpiry} days left`, color: 'warning' as const }
    } else {
      return { text: `Expires ${format(date, 'MMM dd, yyyy')}`, color: 'default' as const }
    }
  }

  const expiryInfo = formatExpiryDate((deal as BankDeal).expiry_date || '')
  const requirements = (deal as BankDeal).requirements as Record<string, unknown>

  return (
    <Card className="card-professional border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-neutral-800 mb-2 break-words">
              {(deal as BankDeal).bank_name}
            </CardTitle>
            <CardDescription className="text-neutral-600 break-words">
              Bank switching reward offer
            </CardDescription>
          </div>
          <Badge 
            variant={expiryInfo.color}
            className="ml-2 shrink-0 whitespace-nowrap"
          >
            {expiryInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Reward Amount - Prominently displayed */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Banknote className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Reward Amount</span>
          </div>
          <div className="text-4xl font-black text-primary-600">
            £{(deal.reward_amount as number)}
          </div>
        </div>

        {/* Requirements Breakdown */}
        <div className="space-y-4 mb-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              Requirements
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Minimum Pay-in */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                <span className="text-sm font-medium text-neutral-700 break-words">Minimum Pay-in</span>
                <span className="text-sm font-bold text-neutral-800 whitespace-nowrap ml-2">£{(deal.min_pay_in as number)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
                <span className="text-sm font-medium text-success-700 break-words">Account Switch</span>
                <div className="flex items-center gap-1 shrink-0">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-bold text-success-700 whitespace-nowrap">Required</span>
                </div>
              </div>

              {/* Direct Debit Requirements */}
              {deal.required_direct_debits && (deal.required_direct_debits as number) > 0 && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg">
                  <span className="text-sm font-medium text-accent-700 break-words">Direct Debits Required</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <CreditCard className="w-4 h-4 text-accent-600" />
                    <span className="text-sm font-bold text-accent-700 whitespace-nowrap">
                      {(deal.required_direct_debits as number)} DD{(deal.required_direct_debits as number) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {requirements && typeof requirements === 'object' && 'maintain_balance' in requirements && Boolean(requirements.maintain_balance) && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg">
                  <span className="text-sm font-medium text-warning-700 break-words">Maintain Balance</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <XCircle className="w-4 h-4 text-warning-600" />
                    <span className="text-sm font-bold text-warning-700 whitespace-nowrap">Required</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time to Payout */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-accent-600 shrink-0" />
              <span className="text-sm font-medium text-accent-700 break-words">Time to Payout</span>
            </div>
            <span className="text-sm font-bold text-accent-700 whitespace-nowrap ml-2">{(deal as BankDeal).time_to_payout}</span>
          </div>
        </div>

        {/* Affiliate Provider Badge */}
        {deal.affiliate_provider && (
          <div className="mb-4">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-accent-50 to-accent-100 text-accent-700 border-accent-200"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {deal.affiliate_provider} • £{deal.commission_rate || 0} commission
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          {/* Start Switch Button */}
          <Button 
            onClick={handleStartSwitch}
            disabled={isStarting || expiryInfo.color === 'destructive'}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Starting Switch...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Start Switch
              </>
            )}
          </Button>

          {/* Apply Now Button (if affiliate URL exists) */}
          {deal.affiliate_url && (
            <Button 
              onClick={handleAffiliateClick}
              disabled={isTrackingClick || expiryInfo.color === 'destructive'}
              variant="outline"
              className="w-full border-accent-200 hover:bg-accent-50 text-accent-700 font-medium py-3"
            >
              {isTrackingClick ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
          )}
          
          {expiryInfo.color === 'destructive' && (
            <p className="text-xs text-error-600 text-center mt-2">
              This deal has expired
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
