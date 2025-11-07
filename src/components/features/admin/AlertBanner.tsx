'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useState } from 'react'

interface AlertBannerProps {
  id: string
  severity: 'info' | 'warning' | 'error'
  title: string
  description: string
  dismissible?: boolean
  onDismiss?: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

export default function AlertBanner({
  id,
  severity,
  title,
  description,
  dismissible = true,
  onDismiss,
  action
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) {
      onDismiss(id)
    }
  }

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = () => {
    switch (severity) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
    }
  }

  return (
    <Alert variant={getVariant()}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-1">{description}</AlertDescription>
            {action && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

