'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '../../ui/toast'
import { Check, X, Loader2 } from 'lucide-react'

interface QuickEditAffiliateProps {
  value: string
  onSave: (newValue: string) => Promise<void> | void
  type: 'url' | 'number' | 'text'
  placeholder?: string
  className?: string
}

export default function QuickEditAffiliate({
  value,
  onSave,
  type,
  placeholder,
  className = ''
}: QuickEditAffiliateProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
  }

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false)
      return
    }

    // Validation
    if (type === 'url' && editValue.trim()) {
      try {
        new URL(editValue.trim())
      } catch {
        addToast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "error"
        })
        return
      }
    }

    if (type === 'number' && editValue.trim()) {
      const numValue = Number(editValue)
      if (isNaN(numValue) || numValue < 0) {
        addToast({
          title: "Invalid Number",
          description: "Please enter a valid number",
          variant: "error"
        })
        return
      }
    }

    setLoading(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
      addToast({
        title: "Success",
        description: "Updated successfully",
        variant: "success"
      })
    } catch (error) {
      console.error('Error saving:', error)
      addToast({
        title: "Error",
        description: "Failed to save changes",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type={type === 'number' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          min={type === 'number' ? '0' : undefined}
          placeholder={placeholder}
          className="h-8 text-sm"
          autoFocus
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`cursor-pointer hover:bg-neutral-100 rounded px-2 py-1 min-h-[32px] flex items-center ${className}`}
    >
      {value || (
        <span className="text-neutral-400 italic">
          {placeholder || 'Click to edit'}
        </span>
      )}
    </div>
  )
}
