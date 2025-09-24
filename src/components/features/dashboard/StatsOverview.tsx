'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSwitchStats, SwitchStats } from '../../../lib/supabase/analytics'
import { BarChart3, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

interface StatsOverviewProps {
  className?: string
}

export default function StatsOverview({ className }: StatsOverviewProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState<SwitchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSwitchStats(user.id)
        setStats(data)
      } catch (err) {
        console.error('Error fetching switch stats:', err)
        setError('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

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
            Key Statistics
          </CardTitle>
          <CardDescription>Your bank switching performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading stats...</span>
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
            Key Statistics
          </CardTitle>
          <CardDescription>Your bank switching performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Key Statistics
          </CardTitle>
          <CardDescription>Your bank switching performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-600">No statistics available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: 'Total Switches',
      value: stats.totalSwitches.toString(),
      description: 'All time switches',
      color: 'from-primary-500 to-primary-600',
      bgColor: 'from-primary-50 to-primary-100',
      borderColor: 'border-primary-200'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      description: 'Completion rate',
      color: 'from-success-500 to-success-600',
      bgColor: 'from-success-50 to-success-100',
      borderColor: 'border-success-200'
    },
    {
      title: 'Average Earnings',
      value: formatCurrency(stats.averageEarnings),
      description: 'Per completed switch',
      color: 'from-accent-500 to-accent-600',
      bgColor: 'from-accent-50 to-accent-100',
      borderColor: 'border-accent-200'
    },
    {
      title: 'Avg. Time',
      value: `${stats.averageTimeToCompletion} days`,
      description: 'To complete switch',
      color: 'from-secondary-500 to-secondary-600',
      bgColor: 'from-secondary-50 to-secondary-100',
      borderColor: 'border-secondary-200'
    }
  ]

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          Key Statistics
        </CardTitle>
        <CardDescription>Your bank switching performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className={`p-4 bg-gradient-to-r ${stat.bgColor} rounded-lg border ${stat.borderColor}`}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-600">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">Active Switches</p>
                  <p className="text-xs text-neutral-600">Currently in progress</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.activeSwitches}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-success-800">Completed Switches</p>
                  <p className="text-xs text-success-600">Successfully finished</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success-600">
                    {stats.completedSwitches}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

