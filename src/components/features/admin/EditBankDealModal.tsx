'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface BankDeal {
  id: string
  bank_name: string
  reward_amount: number
  is_active: boolean
  affiliate_url?: string
  affiliate_provider?: string
  commission_rate?: number
  tracking_enabled: boolean
}

interface EditBankDealModalProps {
  deal: BankDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dealId: string, data: {
    affiliateUrl: string
    affiliateProvider: string
    commissionRate: number
    trackingEnabled: boolean
  }) => Promise<void>
}

export default function EditBankDealModal({ deal, open, onOpenChange, onSave }: EditBankDealModalProps) {
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliateProvider, setAffiliateProvider] = useState('')
  const [commissionRate, setCommissionRate] = useState(0)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      setAffiliateUrl(deal.affiliate_url || '')
      setAffiliateProvider(deal.affiliate_provider || '')
      setCommissionRate(deal.commission_rate || 0)
      setTrackingEnabled(deal.tracking_enabled)
    }
  }, [deal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deal) return

    setIsSaving(true)
    try {
      await onSave(deal.id, {
        affiliateUrl,
        affiliateProvider,
        commissionRate,
        trackingEnabled
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating bank deal:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    if (deal) {
      setAffiliateUrl(deal.affiliate_url || '')
      setAffiliateProvider(deal.affiliate_provider || '')
      setCommissionRate(deal.commission_rate || 0)
      setTrackingEnabled(deal.tracking_enabled)
    }
  }

  if (!deal) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bank Deal Affiliate</DialogTitle>
          <DialogDescription>
            Update affiliate information for {deal.bank_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliateUrl">Affiliate URL</Label>
            <Input
              id="affiliateUrl"
              type="url"
              placeholder="https://example.com/affiliate/..."
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
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
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
