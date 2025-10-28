'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminBankDeal } from '../../../types'
import { Plus } from 'lucide-react'

interface AddBankDealAffiliateDialogProps {
  deals: AdminBankDeal[]
  onAdd: (dealId: string, data: {
    affiliateUrl: string
    affiliateProvider: string
    commissionRate: number
  }) => Promise<void>
}

export default function AddBankDealAffiliateDialog({ deals, onAdd }: AddBankDealAffiliateDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliateProvider, setAffiliateProvider] = useState('')
  const [commissionRate, setCommissionRate] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDealId || !affiliateUrl) return

    setIsSaving(true)
    try {
      await onAdd(selectedDealId, {
        affiliateUrl,
        affiliateProvider,
        commissionRate
      })
      // Reset form
      setSelectedDealId('')
      setAffiliateUrl('')
      setAffiliateProvider('')
      setCommissionRate(0)
      setOpen(false)
    } catch (error) {
      console.error('Failed to add affiliate:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter deals that don't have affiliate data yet
  const availableDeals = deals.filter(deal => !deal.affiliate_url)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Affiliate to Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Affiliate to Bank Deal</DialogTitle>
            <DialogDescription>
              Add affiliate tracking to an existing bank deal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deal">Bank Deal</Label>
              <Select
                value={selectedDealId}
                onValueChange={setSelectedDealId}
                required
              >
                <SelectTrigger id="deal">
                  <SelectValue placeholder="Select a bank deal" />
                </SelectTrigger>
                <SelectContent>
                  {availableDeals.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      All deals have affiliate data
                    </div>
                  ) : (
                    availableDeals.map(deal => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.bank_name} - £{deal.reward_amount}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-url">Affiliate URL *</Label>
              <Input
                id="affiliate-url"
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-provider">Affiliate Provider</Label>
              <Input
                id="affiliate-provider"
                value={affiliateProvider}
                onChange={(e) => setAffiliateProvider(e.target.value)}
                placeholder="e.g., Awin, CJ, Impact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Commission Rate (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                step="0.01"
                min="0"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !selectedDealId || !affiliateUrl}>
              {isSaving ? 'Adding...' : 'Add Affiliate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

