'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminProduct } from '@/types'
import { Plus } from 'lucide-react'

interface AddProductDialogProps {
  onAdd: (data: Omit<AdminProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const productTypes = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'savings_account', label: 'Savings Account' },
  { value: 'loan', label: 'Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' }
]

export default function AddProductDialog({ onAdd }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    productName: '',
    providerName: '',
    productType: 'credit_card' as AdminProduct['product_type'],
    description: '',
    affiliateUrl: '',
    affiliateProvider: '',
    affiliateCommission: 0,
    isActive: true
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productName || !formData.providerName || !formData.affiliateUrl) return

    setIsSaving(true)
    try {
      await onAdd({
        product_name: formData.productName,
        provider_name: formData.providerName,
        product_type: formData.productType,
        description: formData.description || null,
        affiliate_url: formData.affiliateUrl,
        affiliate_provider: formData.affiliateProvider || null,
        affiliate_commission: formData.affiliateCommission,
        is_active: formData.isActive
      })
      // Reset form
      setFormData({
        productName: '',
        providerName: '',
        productType: 'credit_card',
        description: '',
        affiliateUrl: '',
        affiliateProvider: '',
        affiliateCommission: 0,
        isActive: true
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to add product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Affiliate Product</DialogTitle>
            <DialogDescription>
              Add a new affiliate product (credit card, savings, loan, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g., Rewards Mastercard"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider-name">Provider Name *</Label>
                <Input
                  id="provider-name"
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  placeholder="e.g., Barclays"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-type">Product Type *</Label>
              <Select
                value={formData.productType}
                onValueChange={(value) => setFormData({ ...formData, productType: value as AdminProduct['product_type'] })}
              >
                <SelectTrigger id="product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the product..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-url">Affiliate URL *</Label>
              <Input
                id="affiliate-url"
                type="url"
                value={formData.affiliateUrl}
                onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="affiliate-provider">Affiliate Provider</Label>
                <Input
                  id="affiliate-provider"
                  value={formData.affiliateProvider}
                  onChange={(e) => setFormData({ ...formData, affiliateProvider: e.target.value })}
                  placeholder="e.g., Awin, CJ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (£)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.affiliateCommission}
                  onChange={(e) => setFormData({ ...formData, affiliateCommission: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is-active">Status</Label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
              >
                <SelectTrigger id="is-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
            <Button 
              type="submit" 
              disabled={isSaving || !formData.productName || !formData.providerName || !formData.affiliateUrl}
            >
              {isSaving ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

