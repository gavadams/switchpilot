'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AffiliateStats, AffiliateClick, getAffiliateStats, getRecentAffiliateClicks } from '../../../lib/supabase/affiliates-client'
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface AffiliateRevenueProps {
  className?: string
}

export default function AffiliateRevenue({ className }: AffiliateRevenueProps) {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [recentClicks, setRecentClicks] = useState<AffiliateClick[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsData, clicksData] = await Promise.all([
          getAffiliateStats(),
          getRecentAffiliateClicks('', 5) // Will be updated with actual user ID
        ])
        
        setStats(statsData)
        setRecentClicks(clicksData)
      } catch (error) {
        console.error('Error fetching affiliate data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getClickTypeLabel = (clickType: string) => {
    return clickType === 'bank_deal' ? 'Bank Deal' : 'Product'
  }

  const getClickName = (click: AffiliateClick) => {
    if (click.bank_deals) {
      return click.bank_deals.bank_name
    } else if (click.affiliate_products) {
      return click.affiliate_products.product_name
    }
    return 'Unknown'
  }

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            Affiliate Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
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
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          Affiliate Revenue
        </CardTitle>
        <CardDescription>
          Track your affiliate clicks and earnings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <div className="text-2xl font-bold text-primary-600 mb-1">
                  {stats.totalClicks}
                </div>
                <p className="text-sm text-primary-700">Total Clicks</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
                <div className="text-2xl font-bold text-success-600 mb-1">
                  £{stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-success-700">Total Revenue</p>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-600" />
                Breakdown by Type
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-neutral-700">Bank Deals</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-800">{stats.bankDealClicks} clicks</div>
                    <div className="text-xs text-success-600">£{stats.bankDealRevenue.toFixed(2)} earned</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-accent-600" />
                    <span className="text-sm font-medium text-neutral-700">Products</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-800">{stats.productClicks} clicks</div>
                    <div className="text-xs text-success-600">£{stats.productRevenue.toFixed(2)} earned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Clicks */}
            {recentClicks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-neutral-800">Recent Clicks</h4>
                  <Link href="/affiliate">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-2">
                  {recentClicks.slice(0, 3).map((click) => (
                    <div key={click.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={click.click_type === 'bank_deal' ? 'bg-primary-50 text-primary-700' : 'bg-accent-50 text-accent-700'}
                        >
                          {getClickTypeLabel(click.click_type)}
                        </Badge>
                        <span className="text-sm text-neutral-700">{getClickName(click)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">{formatDate(click.clicked_at)}</div>
                        {click.converted && (
                          <Badge className="bg-success-100 text-success-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Converted
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Link href="/affiliate-products" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
              <Link href="/affiliate" className="flex-1">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Tracking
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No affiliate data available</p>
            <Link href="/affiliate-products">
              <Button>
                <ExternalLink className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
