'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database } from '../../../types/supabase'
import { createUserSwitch, checkExistingSwitch } from '../../../lib/supabase/deals'
import { useAuth } from '../../../context/AuthContext'
import { 
  Banknote, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  TrendingUp
} from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface StartSwitchDialogProps {
  deal: BankDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StartSwitchDialog({ deal, open, onOpenChange }: StartSwitchDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const handleStartSwitch = async () => {
    if (!deal || !user) {
      setError('User not authenticated')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      console.log('Creating user switch for user:', user.id, 'deal:', deal.id)
      
      // Check if user already has a switch for this deal
      console.log('Checking for existing switch...')
      const existingSwitch = await checkExistingSwitch(user.id, deal.id)
      console.log('Existing switch check result:', existingSwitch)
      
      if (existingSwitch) {
        console.log('Found existing switch, showing error')
        setError(`You already have an active switch for ${deal.bank_name}. Please check your switches page.`)
        return
      }
      
      console.log('No existing switch found, creating new switch...')
      const result = await createUserSwitch(user.id, deal.id)
      console.log('User switch created successfully:', result)
      
      // Close dialog and redirect to switches page
      onOpenChange(false)
      router.push('/switches')
    } catch (err) {
      console.error('Error in handleStartSwitch:', err)
      setError(err instanceof Error ? err.message : 'Failed to start switch')
    } finally {
      console.log('Setting isCreating to false')
      setIsCreating(false)
    }
  }

  if (!deal) return null

  const requirements = deal.requirements as Record<string, unknown>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Start Bank Switch
          </DialogTitle>
          <DialogDescription>
            Confirm you want to start switching to {deal.bank_name} to claim your reward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 bg-white">
          {/* Deal Summary */}
          <div className="p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {deal.bank_name}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Banknote className="w-5 h-5 text-primary-600" />
                <span className="text-3xl font-black text-primary-600">
                  £{deal.reward_amount}
                </span>
              </div>
              <p className="text-sm text-primary-700 mt-2">Reward Amount</p>
            </div>
          </div>

          {/* Requirements Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              What you need to do:
            </h4>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">Switch your account</span>
                <CheckCircle className="w-4 h-4 text-success-600" />
              </div>
              
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">Pay in £{deal.min_pay_in}</span>
                <CheckCircle className="w-4 h-4 text-success-600" />
              </div>
              
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">Set up {deal.required_direct_debits} direct debits</span>
                <CheckCircle className="w-4 h-4 text-success-600" />
              </div>
              
              {deal.debit_card_transactions > 0 && (
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                  <span className="text-sm text-neutral-700">Make {deal.debit_card_transactions} card transactions</span>
                  <CheckCircle className="w-4 h-4 text-success-600" />
                </div>
              )}
              
              {requirements?.maintain_balance && (
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                  <span className="text-sm text-neutral-700">Maintain minimum balance</span>
                  <CheckCircle className="w-4 h-4 text-success-600" />
                </div>
              )}
            </div>
          </div>

          {/* Time to Payout */}
          <div className="p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-accent-700">Time to payout:</span>
              <Badge className="bg-accent-500 text-white">
                {deal.time_to_payout}
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-error-600" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="p-3 bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-600 mt-0.5" />
              <div className="text-sm text-warning-700">
                <p className="font-medium mb-1">Important:</p>
                <p>Make sure you meet all requirements to receive your reward. We&apos;ll guide you through each step.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartSwitch}
            disabled={isCreating}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Switch...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Start Switch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
