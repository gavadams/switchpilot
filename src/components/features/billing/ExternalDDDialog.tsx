'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { createDirectDebit } from '../../../lib/supabase/direct-debits'

interface ExternalDDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  switchId?: string
  userId: string
}

export default function ExternalDDDialog({ open, onOpenChange, onSuccess, switchId, userId }: ExternalDDDialogProps) {
  const [providerName, setProviderName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'one-time'>('monthly')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!providerName.trim() || !amount.trim()) {
      setError('Please fill in all required fields')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await createDirectDebit({
        user_id: userId,
        switch_id: switchId,
        provider: 'external_manual', // Special provider for manually added DDs
        charity_name: providerName.trim(),
        amount: amountNum,
        frequency: frequency,
        auto_cancel_after_switch: false, // External DDs don't auto-cancel
        stripe_payment_method_id: undefined
      })

      console.log('External DD added successfully')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error('Error adding external DD:', err)
      setError('Failed to add external DD. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setProviderName('')
    setAmount('')
    setFrequency('monthly')
    setError(null)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border shadow-lg" style={{ backgroundColor: 'white', opacity: 1 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-neutral-600" />
            Add External Direct Debit
          </DialogTitle>
          <DialogDescription>
            Track a direct debit you&apos;ve set up outside of SwitchPilot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">External Direct Debit</p>
                  <p className="text-xs text-blue-700">
                    This DD was set up outside SwitchPilot. We&apos;ll track it for your switch requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Provider/Company Name *</Label>
              <Input
                id="provider"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g., Netflix, Spotify, Charity Name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={(value: 'monthly' | 'one-time') => setFrequency(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg" style={{ backgroundColor: 'white', opacity: 1 }}>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          {providerName && amount && (
            <Card className="border-neutral-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-neutral-800 mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Provider:</span>
                    <span className="font-medium">{providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Frequency:</span>
                    <span className="font-medium capitalize">{frequency}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200 text-xs">
                      External
                    </Badge>
                    <span className="text-xs text-neutral-500">Manually tracked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-error-600 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!providerName.trim() || !amount.trim() || isSubmitting}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {isSubmitting ? 'Adding...' : 'Add External DD'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
