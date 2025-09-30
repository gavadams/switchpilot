'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAllActiveDeals } from '../../../lib/supabase/deals'
import { Target, ArrowRight, Clock, Loader2, Star } from 'lucide-react'
import { Database } from '../../../types/supabase'
import Link from 'next/link'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

interface AvailableDealsCardProps {
  className?: string
}

export default function AvailableDealsCard({ className }: AvailableDealsCardProps) {
  const [deals, setDeals] = useState<BankDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllActiveDeals()
        setDeals(data)
      } catch (err) {
        console.error('Error fetching deals:', err)
        setError('Failed to load available deals')
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getExpiryCountdown = (expiryDate: string | null): string => {
    if (!expiryDate) return 'No expiry'
    
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return '1 day left'
    if (diffDays <= 7) return `${diffDays} days left`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`
    return `${Math.ceil(diffDays / 30)} months left`
  }

  const getExpiryColor = (expiryDate: string | null): string => {
    if (!expiryDate) return 'text-neutral-600'
    
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'text-red-600'
    if (diffDays <= 7) return 'text-red-600'
    if (diffDays <= 30) return 'text-accent-600'
    return 'text-neutral-600'
  }

  const getRewardBadgeColor = (amount: number): string => {
    if (amount >= 200) return 'bg-success-500'
    if (amount >= 100) return 'bg-primary-500'
    return 'bg-accent-500'
  }

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Available Deals
          </CardTitle>
          <CardDescription>Current bank switching offers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading deals...</span>
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
            <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Available Deals
          </CardTitle>
          <CardDescription>Current bank switching offers</CardDescription>
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

  const topDeals = deals.slice(0, 3)

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            Available Deals
          </div>
          <Badge className="bg-secondary-500 text-white border-0">
            {deals.length}
          </Badge>
        </CardTitle>
        <CardDescription>Current bank switching offers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topDeals.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-secondary-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Deals Available</h3>
            <p className="text-neutral-600">Check back later for new bank switching offers!</p>
          </div>
        ) : (
          <>
            {/* Top Deals List */}
            <div className="space-y-3">
              {topDeals.map((deal, index) => (
                <div key={deal.id} className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-neutral-800">
                          {deal.bank_name}
                        </h4>
                        {index === 0 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">
                        {deal.description || 'Bank switching offer'}
                      </p>
                    </div>
                    <Badge className={`${getRewardBadgeColor(deal.reward_amount)} text-white border-0`}>
                      {formatCurrency(deal.reward_amount)}
                    </Badge>
                  </div>

                  {/* Deal Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span className={getExpiryColor(deal.expiry_date)}>
                        {getExpiryCountdown(deal.expiry_date)}
                      </span>
                    </div>
                    <Link href={`/deals?deal=${deal.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <Link href="/deals" className="block">
                <Button 
                  variant="outline" 
                  className="w-full group hover:bg-secondary-50 hover:border-secondary-200"
                >
                  <span>View All Deals</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              {topDeals.length > 0 && (
                <Link href={`/deals?deal=${topDeals[0].id}`} className="block">
                  <Button className="w-full bg-secondary-500 hover:bg-secondary-600 text-white">
                    <Star className="w-4 h-4 mr-2" />
                    Start Best Deal
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

