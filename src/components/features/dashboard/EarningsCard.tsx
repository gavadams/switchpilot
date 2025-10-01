'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUserEarnings, UserEarnings } from '../../../lib/supabase/analytics'
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

interface EarningsCardProps {
  className?: string
}

export default function EarningsCard({ className }: EarningsCardProps) {
  const { user } = useAuth()
  const [earnings, setEarnings] = useState<UserEarnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchEarnings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserEarnings(user.id)
        setEarnings(data)
      } catch (err) {
        console.error('Error fetching earnings:', err)
        setError('Failed to load earnings data')
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [user?.id])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrencyDetailed = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            Earnings Overview
          </CardTitle>
          <CardDescription>Your bank switching rewards and projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading earnings...</span>
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
            <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            Earnings Overview
          </CardTitle>
          <CardDescription>Your bank switching rewards and projections</CardDescription>
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

  if (!earnings) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            Earnings Overview
          </CardTitle>
          <CardDescription>Your bank switching rewards and projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-600">No earnings data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isGrowthPositive = earnings.monthlyGrowth >= 0
  const growthIcon = isGrowthPositive ? TrendingUp : TrendingDown
  const growthColor = isGrowthPositive ? 'text-success-600' : 'text-red-600'
  const growthBgColor = isGrowthPositive ? 'bg-success-50' : 'bg-red-50'

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <span className="break-words">Earnings Overview</span>
        </CardTitle>
        <CardDescription>Your bank switching rewards and projections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Lifetime Earnings - Large Display */}
        <div className="text-center p-6 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200">
          <p className="text-sm font-medium text-success-700 mb-2 break-words">Total Lifetime Earnings</p>
          <p className="text-4xl font-bold text-success-600 mb-2 break-words">
            {formatCurrency(earnings.totalLifetime)}
          </p>
          <Badge className="bg-success-500 text-white border-0">
            All Time
          </Badge>
        </div>

        {/* This Month vs Last Month */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <p className="text-sm font-medium text-primary-700 mb-1 break-words">This Month</p>
            <p className="text-2xl font-bold text-primary-600 break-words">
              {formatCurrency(earnings.thisMonth)}
            </p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200">
            <p className="text-sm font-medium text-neutral-700 mb-1 break-words">Last Month</p>
            <p className="text-2xl font-bold text-neutral-600 break-words">
              {formatCurrency(earnings.lastMonth)}
            </p>
          </div>
        </div>

        {/* Growth Indicator */}
        {earnings.lastMonth > 0 && (
          <div className={`flex items-center justify-center p-4 ${growthBgColor} rounded-lg border ${isGrowthPositive ? 'border-success-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-2">
              {isGrowthPositive ? (
                <TrendingUp className={`w-5 h-5 ${growthColor}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${growthColor}`} />
              )}
              <span className={`font-semibold ${growthColor}`}>
                {isGrowthPositive ? '+' : ''}{earnings.monthlyGrowth.toFixed(1)}%
              </span>
              <span className="text-sm text-neutral-600">vs last month</span>
            </div>
          </div>
        )}

        {/* Projected Earnings */}
        <div className="text-center p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200">
          <p className="text-sm font-medium text-accent-700 mb-1">Projected Earnings</p>
          <p className="text-2xl font-bold text-accent-600">
            {formatCurrency(earnings.projectedEarnings)}
          </p>
          <p className="text-xs text-accent-600 mt-1">From active switches</p>
        </div>

        {/* View Details Link */}
        <div className="pt-4 border-t border-neutral-200">
          <Button 
            variant="outline" 
            className="w-full group hover:bg-primary-50 hover:border-primary-200"
            onClick={() => {
              // TODO: Navigate to detailed analytics page
              console.log('Navigate to analytics page')
            }}
          >
            <span>View Detailed Analytics</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

