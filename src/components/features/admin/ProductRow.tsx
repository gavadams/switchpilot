'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminProduct } from '../../../types'
import { Edit, Save, X, ExternalLink, Trash2 } from 'lucide-react'

interface ProductRowProps {
  product: AdminProduct
  onUpdate: (productId: string, updates: Partial<AdminProduct>) => Promise<void>
  onDelete: (productId: string) => Promise<void>
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

export default function ProductRow({ product, onUpdate, onDelete }: ProductRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    productName: product.product_name,
    providerName: product.provider_name,
    productType: product.product_type,
    affiliateUrl: product.affiliate_url,
    affiliateProvider: product.affiliate_provider || '',
    affiliateCommission: product.affiliate_commission,
    isActive: product.is_active
  })

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData({
      productName: product.product_name,
      providerName: product.provider_name,
      productType: product.product_type,
      affiliateUrl: product.affiliate_url,
      affiliateProvider: product.affiliate_provider || '',
      affiliateCommission: product.affiliate_commission,
      isActive: product.is_active
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(product.id, {
        product_name: editedData.productName,
        provider_name: editedData.providerName,
        product_type: editedData.productType,
        affiliate_url: editedData.affiliateUrl,
        affiliate_provider: editedData.affiliateProvider || null,
        affiliate_commission: editedData.affiliateCommission,
        is_active: editedData.isActive
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
      await onDelete(product.id)
    }
  }

  const productTypeLabel = productTypes.find(t => t.value === product.product_type)?.label || product.product_type

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        {isEditing ? (
          <Input
            value={editedData.productName}
            onChange={(e) => setEditedData({ ...editedData, productName: e.target.value })}
            className="max-w-xs"
          />
        ) : (
          <div className="font-medium">{product.product_name}</div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Input
            value={editedData.providerName}
            onChange={(e) => setEditedData({ ...editedData, providerName: e.target.value })}
            className="max-w-xs"
          />
        ) : (
          <span className="text-sm">{product.provider_name}</span>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Select
            value={editedData.productType}
            onValueChange={(value) => setEditedData({ ...editedData, productType: value as AdminProduct['product_type'] })}
          >
            <SelectTrigger className="max-w-[150px] bg-white border-neutral-200">
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
        ) : (
          <Badge variant="outline">{productTypeLabel}</Badge>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Input
            value={editedData.affiliateUrl}
            onChange={(e) => setEditedData({ ...editedData, affiliateUrl: e.target.value })}
            placeholder="https://..."
            className="max-w-md"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-xs">{product.affiliate_url}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(product.affiliate_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editedData.affiliateCommission}
            onChange={(e) => setEditedData({ ...editedData, affiliateCommission: parseFloat(e.target.value) || 0 })}
            className="max-w-[100px]"
          />
        ) : (
          <span className="text-sm">£{product.affiliate_commission.toFixed(2)}</span>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Select
            value={editedData.isActive ? 'true' : 'false'}
            onValueChange={(value) => setEditedData({ ...editedData, isActive: value === 'true' })}
          >
            <SelectTrigger className="max-w-[100px] bg-white border-neutral-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={product.is_active ? 'default' : 'secondary'}>
            {product.is_active ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleEdit}
                size="sm"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleDelete}
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

