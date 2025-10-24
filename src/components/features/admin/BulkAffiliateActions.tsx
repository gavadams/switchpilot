'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '../../ui/toast'
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface BulkAffiliateActionsProps {
  selectedItems: string[]
  onClearSelection: () => void
  onBulkAction: (action: string, items: string[]) => Promise<void> | void
}

const BULK_ACTIONS = [
  { value: 'activate', label: 'Activate Selected', icon: CheckCircle },
  { value: 'deactivate', label: 'Deactivate Selected', icon: XCircle },
  { value: 'delete', label: 'Delete Selected', icon: Trash2, destructive: true }
]

export default function BulkAffiliateActions({
  selectedItems,
  onClearSelection,
  onBulkAction
}: BulkAffiliateActionsProps) {
  const [selectedAction, setSelectedAction] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const selectedActionData = BULK_ACTIONS.find(action => action.value === selectedAction)

  const handleActionSelect = (action: string) => {
    setSelectedAction(action)
    
    const actionData = BULK_ACTIONS.find(a => a.value === action)
    if (actionData?.destructive) {
      setShowConfirmDialog(true)
    } else {
      executeAction(action)
    }
  }

  const executeAction = async (action: string) => {
    setLoading(true)
    try {
      await onBulkAction(action, selectedItems)
      
      addToast({
        title: "Success",
        description: `Bulk action completed for ${selectedItems.length} items`,
        variant: "success"
      })
      
      onClearSelection()
      setSelectedAction('')
    } catch (error) {
      console.error('Bulk action error:', error)
      addToast({
        title: "Error",
        description: "Failed to complete bulk action",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = () => {
    setShowConfirmDialog(false)
    executeAction(selectedAction)
  }

  const handleCancelAction = () => {
    setShowConfirmDialog(false)
    setSelectedAction('')
  }

  if (selectedItems.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-primary-600">
                {selectedItems.length} selected
              </Badge>
              <span className="text-sm text-neutral-600">
                {selectedItems.length === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedAction} onValueChange={handleActionSelect}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  {BULK_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      <div className="flex items-center gap-2">
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirm Destructive Action
            </DialogTitle>
            <DialogDescription>
              You are about to <strong>{selectedActionData?.label.toLowerCase()}</strong> {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-neutral-600">
              Are you sure you want to continue? This will permanently affect the selected items.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAction}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmAction}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
