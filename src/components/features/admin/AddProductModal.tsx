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
import { Checkbox } from '@/components/ui/checkbox'
import { Database } from '../../../types/supabase'
import { useToast } from '../../ui/toast'
import { Loader2, Plus, X } from 'lucide-react'

type AffiliateProduct = Database['public']['Tables']['affiliate_products']['Row']

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: AffiliateProduct | null
  onSave: (data: {
    product_type: string
    provider_name: string
    product_name: string
    description: string
    key_features: string[]
    affiliate_url: string
    affiliate_provider: string
    affiliate_commission: number
    commission_type: string
    image_url?: string
    is_active: boolean
  }) => void
}

const PRODUCT_TYPES = [
  'credit_card',
  'savings_account',
  'investment',
  'loan',
  'mortgage',
  'insurance',
  'other'
]

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

export default function AddProductModal({
  isOpen,
  onClose,
  product,
  onSave
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    product_type: '',
    provider_name: '',
    product_name: '',
    description: '',
    key_features: [''],
    affiliate_url: '',
    affiliate_provider: '',
    affiliate_commission: '',
    commission_type: 'CPA',
    image_url: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        product_type: product.product_type,
        provider_name: product.provider_name,
        product_name: product.product_name,
        description: product.description || '',
        key_features: [],
        affiliate_url: product.affiliate_url,
        affiliate_provider: product.affiliate_provider || '',
        affiliate_commission: product.affiliate_commission.toString(),
        commission_type: 'CPA', // Default to CPA
        image_url: '',
        is_active: product.is_active
      })
    } else {
      setFormData({
        product_type: '',
        provider_name: '',
        product_name: '',
        description: '',
        key_features: [''],
        affiliate_url: '',
        affiliate_provider: '',
        affiliate_commission: '',
        commission_type: 'CPA',
        image_url: '',
        is_active: true
      })
    }
    setErrors({})
  }, [product, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_type) {
      newErrors.product_type = 'Product type is required'
    }

    if (!formData.provider_name.trim()) {
      newErrors.provider_name = 'Provider name is required'
    }

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

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

    // Validate key features
    const validFeatures = formData.key_features.filter(feature => feature.trim())
    if (validFeatures.length === 0) {
      newErrors.key_features = 'At least one key feature is required'
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

    setLoading(true)
    try {
      const validFeatures = formData.key_features.filter(feature => feature.trim())
      
      await onSave({
        product_type: formData.product_type,
        provider_name: formData.provider_name.trim(),
        product_name: formData.product_name.trim(),
        description: formData.description.trim(),
        key_features: validFeatures,
        affiliate_url: formData.affiliate_url.trim(),
        affiliate_provider: formData.affiliate_provider,
        affiliate_commission: Number(formData.affiliate_commission),
        commission_type: formData.commission_type,
        image_url: formData.image_url.trim() || undefined,
        is_active: formData.is_active
      })

      addToast({
        title: "Success",
        description: product ? "Product updated successfully" : "Product created successfully",
        variant: "success"
      })

      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      addToast({
        title: "Error",
        description: "Failed to save product",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addKeyFeature = () => {
    setFormData(prev => ({
      ...prev,
      key_features: [...prev.key_features, '']
    }))
  }

  const removeKeyFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_features: prev.key_features.filter((_, i) => i !== index)
    }))
  }

  const updateKeyFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      key_features: prev.key_features.map((feature, i) => i === index ? value : feature)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Affiliate Product' : 'Add New Affiliate Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update product details and affiliate settings' : 'Create a new affiliate product'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type *</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) => handleInputChange('product_type', value)}
              >
                <SelectTrigger className={errors.product_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_type && (
                <p className="text-sm text-red-600">{errors.product_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_name">Provider Name *</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) => handleInputChange('provider_name', e.target.value)}
                placeholder="e.g., Barclays, HSBC, Santander"
                className={errors.provider_name ? 'border-red-500' : ''}
              />
              {errors.provider_name && (
                <p className="text-sm text-red-600">{errors.provider_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              placeholder="e.g., Barclays Premier Current Account"
              className={errors.product_name ? 'border-red-500' : ''}
            />
            {errors.product_name && (
              <p className="text-sm text-red-600">{errors.product_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the product and its benefits..."
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Key Features *</Label>
            <div className="space-y-2">
              {formData.key_features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateKeyFeature(index, e.target.value)}
                    placeholder="Enter a key feature..."
                    className="flex-1"
                  />
                  {formData.key_features.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeKeyFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addKeyFeature}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Feature
              </Button>
            </div>
            {errors.key_features && (
              <p className="text-sm text-red-600">{errors.key_features}</p>
            )}
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
            <Label htmlFor="image_url">Image URL (Optional)</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://example.com/product-image.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked as boolean)}
            />
            <Label htmlFor="is_active">Active (visible to users)</Label>
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
                product ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
