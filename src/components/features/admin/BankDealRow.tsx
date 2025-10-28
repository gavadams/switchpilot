'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AdminBankDeal } from '../../../types'
import { Edit, Save, X, ExternalLink, Trash2 } from 'lucide-react'

interface BankDealRowProps {
  deal: AdminBankDeal
  onUpdate: (dealId: string, updates: Partial<AdminBankDeal>) => Promise<void>
  onDelete: (dealId: string) => Promise<void>
}

export default function BankDealRow({ deal, onUpdate, onDelete }: BankDealRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    affiliateUrl: deal.affiliate_url || '',
    affiliateProvider: deal.affiliate_provider || '',
    commissionRate: deal.commission_rate || 0,
    trackingEnabled: deal.tracking_enabled
  })

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData({
      affiliateUrl: deal.affiliate_url || '',
      affiliateProvider: deal.affiliate_provider || '',
      commissionRate: deal.commission_rate || 0,
      trackingEnabled: deal.tracking_enabled
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({
      affiliateUrl: deal.affiliate_url || '',
      affiliateProvider: deal.affiliate_provider || '',
      commissionRate: deal.commission_rate || 0,
      trackingEnabled: deal.tracking_enabled
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(deal.id, {
        affiliate_url: editedData.affiliateUrl || null,
        affiliate_provider: editedData.affiliateProvider || null,
        commission_rate: editedData.commissionRate,
        tracking_enabled: editedData.trackingEnabled
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to remove affiliate data from this bank deal?')) {
      await onDelete(deal.id)
    }
  }

  const hasAffiliateData = deal.affiliate_url || deal.affiliate_provider

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        <div className="font-medium">{deal.bank_name}</div>
        <div className="text-sm text-muted-foreground">£{deal.reward_amount}</div>
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
            {deal.affiliate_url ? (
              <>
                <span className="text-sm truncate max-w-xs">{deal.affiliate_url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(deal.affiliate_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No URL</span>
            )}
          </div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Input
            value={editedData.affiliateProvider}
            onChange={(e) => setEditedData({ ...editedData, affiliateProvider: e.target.value })}
            placeholder="e.g., Awin, CJ"
            className="max-w-xs"
          />
        ) : (
          <span className="text-sm">{deal.affiliate_provider || '-'}</span>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={editedData.commissionRate}
            onChange={(e) => setEditedData({ ...editedData, commissionRate: parseFloat(e.target.value) || 0 })}
            className="max-w-[100px]"
          />
        ) : (
          <span className="text-sm">{deal.commission_rate.toFixed(2)}%</span>
        )}
      </td>
      <td className="p-4">
        <Badge variant={deal.is_active ? 'default' : 'secondary'}>
          {deal.is_active ? 'Active' : 'Inactive'}
        </Badge>
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
              {hasAffiliateData && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

