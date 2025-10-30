'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { HealthStatus } from '@/types/scraping'

interface HealthStatusBadgeProps {
  health: HealthStatus
  showDetails?: boolean
}

export default function HealthStatusBadge({ health, showDetails = false }: HealthStatusBadgeProps) {
  const getVariant = () => {
    switch (health.status) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle2 className="h-3 w-3 mr-1" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 mr-1" />
      case 'critical':
        return <AlertCircle className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  const getColorClass = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-700 border-green-500/20'
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'critical':
        return 'bg-red-500/10 text-red-700 border-red-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className={`flex items-center gap-1 ${getColorClass()}`}>
        {getIcon()}
        <span className="capitalize">{health.status}</span>
      </Badge>
      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {health.successRate.toFixed(0)}% success • {health.consecutiveFailures} failures
        </div>
      )}
    </div>
  )
}

