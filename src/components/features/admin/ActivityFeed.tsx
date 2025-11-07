'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'user_registration' | 'switch_completed' | 'payment' | 'system_alert' | 'scraping' | 'affiliate'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
  onLoadMore?: () => void
}

export default function ActivityFeed({ activities, loading, onLoadMore }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return '👤'
      case 'switch_completed':
        return '✅'
      case 'payment':
        return '💳'
      case 'system_alert':
        return '⚠️'
      case 'scraping':
        return '🕷️'
      case 'affiliate':
        return '🔗'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return 'bg-blue-100 text-blue-800'
      case 'switch_completed':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-emerald-100 text-emerald-800'
      case 'system_alert':
        return 'bg-yellow-100 text-yellow-800'
      case 'scraping':
        return 'bg-purple-100 text-purple-800'
      case 'affiliate':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className={getActivityColor(activity.type)}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                </div>
              </div>
            ))}
            {onLoadMore && (
              <button
                onClick={onLoadMore}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
              >
                Load more...
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

