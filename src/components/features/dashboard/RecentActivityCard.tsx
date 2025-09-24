'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRecentActivity, RecentActivity } from '../../../lib/supabase/analytics'
import { 
  BarChart3, 
  ArrowRight, 
  Loader2, 
  Play, 
  CheckCircle, 
  DollarSign, 
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityCardProps {
  className?: string
}

export default function RecentActivityCard({ className }: RecentActivityCardProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchActivities = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRecentActivity(user.id, 10)
        setActivities(data)
      } catch (err) {
        console.error('Error fetching recent activity:', err)
        setError('Failed to load recent activity')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [user?.id])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'switch_started':
        return <Play className="w-4 h-4 text-primary-600" />
      case 'step_completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'reward_received':
        return <DollarSign className="w-4 h-4 text-success-600" />
      case 'deal_expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-neutral-600" />
    }
  }

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'switch_started':
        return 'bg-primary-50 border-primary-200'
      case 'step_completed':
        return 'bg-success-50 border-success-200'
      case 'reward_received':
        return 'bg-success-50 border-success-200'
      case 'deal_expired':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-neutral-50 border-neutral-200'
    }
  }

  const getActivityBadgeColor = (type: string): string => {
    switch (type) {
      case 'switch_started':
        return 'bg-primary-500'
      case 'step_completed':
        return 'bg-success-500'
      case 'reward_received':
        return 'bg-success-500'
      case 'deal_expired':
        return 'bg-red-500'
      default:
        return 'bg-neutral-500'
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest bank switching activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading activity...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest bank switching activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest bank switching activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Recent Activity</h3>
            <p className="text-neutral-600 mb-4">Start your first bank switch to see activity here!</p>
            <Button 
              onClick={() => window.location.href = '/deals'}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              Browse Deals
            </Button>
          </div>
        ) : (
          <>
            {/* Activity Timeline */}
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline Line */}
                  {index < activities.slice(0, 5).length - 1 && (
                    <div className="absolute left-6 top-8 w-0.5 h-12 bg-neutral-200"></div>
                  )}
                  
                  <div className={`flex gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
                    {/* Activity Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-neutral-800 mb-1">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-neutral-600 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getActivityBadgeColor(activity.type)} text-white border-0 text-xs`}>
                              {activity.type.replace('_', ' ')}
                            </Badge>
                            {activity.amount && (
                              <span className="text-sm font-semibold text-success-600">
                                {formatCurrency(activity.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-neutral-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Link */}
            {activities.length > 5 && (
              <div className="pt-4 border-t border-neutral-200">
                <Button 
                  variant="outline" 
                  className="w-full group hover:bg-accent-50 hover:border-accent-200"
                  onClick={() => {
                    // TODO: Navigate to detailed activity page
                    console.log('Navigate to activity page')
                  }}
                >
                  <span>View More Activity</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

