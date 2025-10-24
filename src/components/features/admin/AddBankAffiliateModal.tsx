'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Database } from '../../../types/supabase'
import { useToast } from '../../ui/toast'
import { Loader2 } from 'lucide-react'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface AddBankAffiliateModalProps {
  isOpen: boolean
  onClose: () => void
  deal: BankDeal | null
  onSave: (data: {
    dealId: string
    affiliate_url: string
    affiliate_provider: string
    affiliate_commission: number
    commission_type: string
    notes?: string
  }) => void
}

const AFFILIATE_PROVIDERS = [
  'TopCashback',
  'Quidco',
  'Direct',
  'MoneySuperMarket',
  'Compare the Market',
  'GoCompare',
  'Confused.com',
  'Uswitch',
  'Other'
]

export default function AddBankAffiliateModal({
  isOpen,
  onClose,
  deal,
  onSave
}: AddBankAffiliateModalProps) {
  const [formData, setFormData] = useState({
    affiliate_url: '',
    affiliate_provider: '',
    affiliate_commission: '',
    commission_type: 'CPA',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  useEffect(() => {
    if (deal) {
      setFormData({
        affiliate_url: deal.affiliate_url || '',
        affiliate_provider: deal.affiliate_provider || '',
        affiliate_commission: deal.commission_rate?.toString() || '',
        commission_type: 'CPA', // Default to CPA
        notes: ''
      })
    } else {
      setFormData({
        affiliate_url: '',
        affiliate_provider: '',
        affiliate_commission: '',
        commission_type: 'CPA',
        notes: ''
      })
    }
    setErrors({})
  }, [deal, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.affiliate_url.trim()) {
      newErrors.affiliate_url = 'Affiliate URL is required'
    } else if (!isValidUrl(formData.affiliate_url)) {
      newErrors.affiliate_url = 'Please enter a valid URL'
    }

    if (!formData.affiliate_provider) {
      newErrors.affiliate_provider = 'Affiliate provider is required'
    }

    if (!formData.affiliate_commission.trim()) {
      newErrors.affiliate_commission = 'Commission amount is required'
    } else if (isNaN(Number(formData.affiliate_commission)) || Number(formData.affiliate_commission) < 0) {
      newErrors.affiliate_commission = 'Please enter a valid commission amount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!deal) {
      addToast({
        title: "Error",
        description: "No bank deal selected",
        variant: "error"
      })
      return
    }

    setLoading(true)
    try {
      await onSave({
        dealId: deal.id,
        affiliate_url: formData.affiliate_url.trim(),
        affiliate_provider: formData.affiliate_provider,
        affiliate_commission: Number(formData.affiliate_commission),
        commission_type: formData.commission_type,
        notes: formData.notes.trim() || undefined
      })

      addToast({
        title: "Success",
        description: "Affiliate link updated successfully",
        variant: "success"
      })

      onClose()
    } catch (error) {
      console.error('Error saving affiliate data:', error)
      addToast({
        title: "Error",
        description: "Failed to save affiliate data",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {deal ? 'Edit Affiliate Link' : 'Add Affiliate Link'}
          </DialogTitle>
          <DialogDescription>
            {deal ? `Configure affiliate settings for ${deal.bank_name}` : 'Set up affiliate tracking for a bank deal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Deal</Label>
              <Input
                id="bank_name"
                value={deal?.bank_name || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward_amount">Current Reward</Label>
              <Input
                id="reward_amount"
                value={deal ? `£${deal.reward_amount}` : ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliate_url">Affiliate URL *</Label>
            <Input
              id="affiliate_url"
              value={formData.affiliate_url}
              onChange={(e) => handleInputChange('affiliate_url', e.target.value)}
              placeholder="https://example.com/affiliate-link"
              className={errors.affiliate_url ? 'border-red-500' : ''}
            />
            {errors.affiliate_url && (
              <p className="text-sm text-red-600">{errors.affiliate_url}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate_provider">Affiliate Provider *</Label>
              <Select
                value={formData.affiliate_provider}
                onValueChange={(value) => handleInputChange('affiliate_provider', value)}
              >
                <SelectTrigger className={errors.affiliate_provider ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {AFFILIATE_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.affiliate_provider && (
                <p className="text-sm text-red-600">{errors.affiliate_provider}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliate_commission">Commission Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">£</span>
                <Input
                  id="affiliate_commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.affiliate_commission}
                  onChange={(e) => handleInputChange('affiliate_commission', e.target.value)}
                  placeholder="0.00"
                  className={`pl-8 ${errors.affiliate_commission ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.affiliate_commission && (
                <p className="text-sm text-red-600">{errors.affiliate_commission}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_type">Commission Type *</Label>
            <Select
              value={formData.commission_type}
              onValueChange={(value) => handleInputChange('commission_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select commission type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPA">CPA (Cost Per Acquisition)</SelectItem>
                <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this affiliate link..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Affiliate Link'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
