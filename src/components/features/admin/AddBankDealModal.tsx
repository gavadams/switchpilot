'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus } from 'lucide-react'

interface BankDeal {
  id: string
  bank_name: string
  reward_amount: number
  is_active: boolean
}

interface AddBankDealModalProps {
  deals: BankDeal[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dealId: string, data: {
    affiliateUrl: string
    affiliateProvider: string
    commissionRate: number
    trackingEnabled: boolean
  }) => Promise<void>
}

export default function AddBankDealModal({ deals, open, onOpenChange, onSave }: AddBankDealModalProps) {
  const [selectedDealId, setSelectedDealId] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliateProvider, setAffiliateProvider] = useState('')
  const [commissionRate, setCommissionRate] = useState(0)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDealId) return

    setIsSaving(true)
    try {
      await onSave(selectedDealId, {
        affiliateUrl,
        affiliateProvider,
        commissionRate,
        trackingEnabled
      })
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error adding bank deal affiliate:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedDealId('')
    setAffiliateUrl('')
    setAffiliateProvider('')
    setCommissionRate(0)
    setTrackingEnabled(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const availableDeals = deals.filter(deal =>
    !deal.affiliate_url || deal.affiliate_url.trim() === ''
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Bank Deal Affiliate</DialogTitle>
          <DialogDescription>
            Add affiliate tracking to an existing bank deal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dealSelect">Select Bank Deal</Label>
            <Select value={selectedDealId} onValueChange={setSelectedDealId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bank deal" />
              </SelectTrigger>
              <SelectContent>
                {availableDeals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.bank_name} - £{deal.reward_amount.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliateUrl">Affiliate URL</Label>
            <Input
              id="affiliateUrl"
              type="url"
              placeholder="https://example.com/affiliate/..."
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="affiliateProvider">Affiliate Provider</Label>
            <Input
              id="affiliateProvider"
              placeholder="e.g., Awin, CJ Affiliate, Rakuten..."
              value={affiliateProvider}
              onChange={(e) => setAffiliateProvider(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0.0"
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trackingEnabled"
              checked={trackingEnabled}
              onCheckedChange={(checked) => setTrackingEnabled(checked as boolean)}
            />
            <Label htmlFor="trackingEnabled">Enable click tracking</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !selectedDealId}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Affiliate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
