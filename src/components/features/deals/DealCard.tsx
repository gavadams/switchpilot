'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database } from '../../../types/supabase'
import { format } from 'date-fns'
import { 
  Banknote, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface DealCardProps {
  deal: BankDeal
  onStartSwitch: (dealId: string) => void
}

export default function DealCard({ deal, onStartSwitch }: DealCardProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStartSwitch = async () => {
    setIsStarting(true)
    try {
      await onStartSwitch(deal.id)
    } finally {
      setIsStarting(false)
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

  const expiryInfo = formatExpiryDate(deal.expiry_date || '')
  const requirements = deal.requirements as Record<string, unknown>

  return (
    <Card className="card-professional border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-neutral-800 mb-2">
              {deal.bank_name}
            </CardTitle>
            <CardDescription className="text-neutral-600">
              Bank switching reward offer
            </CardDescription>
          </div>
          <Badge 
            variant={expiryInfo.color}
            className="ml-2 shrink-0"
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
            £{deal.reward_amount}
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
                <span className="text-sm font-medium text-neutral-700">Minimum Pay-in</span>
                <span className="text-sm font-bold text-neutral-800">£{deal.min_pay_in}</span>
              </div>

              {/* Direct Debits */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                <span className="text-sm font-medium text-neutral-700">Direct Debits</span>
                <Badge variant="secondary" className="bg-secondary-100 text-secondary-700">
                  {deal.required_direct_debits} required
                </Badge>
              </div>

              {/* Card Transactions */}
              {deal.debit_card_transactions > 0 && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <span className="text-sm font-medium text-neutral-700">Card Transactions</span>
                  <Badge variant="secondary" className="bg-accent-100 text-accent-700">
                    {deal.debit_card_transactions} required
                  </Badge>
                </div>
              )}

              {/* Account Switch */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
                <span className="text-sm font-medium text-success-700">Account Switch</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-bold text-success-700">Required</span>
                </div>
              </div>

              {/* Balance Maintenance */}
              {requirements?.maintain_balance && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg">
                  <span className="text-sm font-medium text-warning-700">Maintain Balance</span>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-warning-600" />
                    <span className="text-sm font-bold text-warning-700">Required</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time to Payout */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium text-accent-700">Time to Payout</span>
            </div>
            <span className="text-sm font-bold text-accent-700">{deal.time_to_payout}</span>
          </div>
        </div>

        {/* Start Switch Button */}
        <div className="mt-auto">
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
