'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus } from 'lucide-react'

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    productName: string
    providerName: string
    productType: string
    description: string
    affiliateUrl: string
    affiliateProvider: string
    affiliateCommission: number
    isActive: boolean
  }) => Promise<void>
}

const PRODUCT_TYPES = [
  'Credit Cards',
  'Loans',
  'Savings',
  'Insurance',
  'Investments',
  'Banking',
  'Other'
]

export default function AddProductModal({ open, onOpenChange, onSave }: AddProductModalProps) {
  const [productName, setProductName] = useState('')
  const [providerName, setProviderName] = useState('')
  const [productType, setProductType] = useState('')
  const [description, setDescription] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliateProvider, setAffiliateProvider] = useState('')
  const [affiliateCommission, setAffiliateCommission] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSaving(true)
    try {
      await onSave({
        productName,
        providerName,
        productType,
        description,
        affiliateUrl,
        affiliateProvider,
        affiliateCommission,
        isActive
      })
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setProductName('')
    setProviderName('')
    setProductType('')
    setDescription('')
    setAffiliateUrl('')
    setAffiliateProvider('')
    setAffiliateCommission(0)
    setIsActive(true)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-neutral-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>Add Affiliate Product</DialogTitle>
          <DialogDescription>
            Create a new affiliate product with tracking information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g., Premium Credit Card"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input
                id="providerName"
                placeholder="e.g., Bank Name"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Product Type</Label>
            <Select value={productType} onValueChange={setProductType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Brief product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="affiliateProvider">Affiliate Provider</Label>
              <Input
                id="affiliateProvider"
                placeholder="e.g., Awin, CJ Affiliate..."
                value={affiliateProvider}
                onChange={(e) => setAffiliateProvider(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliateCommission">Commission (£)</Label>
              <Input
                id="affiliateCommission"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={affiliateCommission}
                onChange={(e) => setAffiliateCommission(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive">Product is active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
