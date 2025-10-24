'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointer, 
  DollarSign,
  Download,
  Filter,
  BarChart3,
  Target
} from 'lucide-react'
// import { getTopPerformingAffiliates, getAffiliatePerformance } from '../../../../lib/supabase/admin-affiliates'

interface PerformanceData {
  bankDeals: Array<{
    id: string
    bank_name: string
    reward_amount: number
    performance: {
      totalClicks: number
      totalConversions: number
      totalRevenue: number
    }
  }>
  products: Array<{
    id: string
    product_name: string
    provider_name: string
    performance: {
      totalClicks: number
      totalConversions: number
      totalRevenue: number
    }
  }>
}

export default function AffiliatePerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [sortBy, setSortBy] = useState('clicks')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPerformanceData()
  }, [dateRange])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      // TODO: Implement real data fetching
      // const data = await getTopPerformingAffiliates(20)
      setPerformanceData({
        bankDeals: [],
        products: []
      })
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConversionRate = (clicks: number, conversions: number) => {
    return clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0.0'
  }

  // const getTrendIcon = (value: number, threshold: number) => {
  //   return value >= threshold ? (
  //     <TrendingUp className="w-4 h-4 text-green-600" />
  //   ) : (
  //     <TrendingDown className="w-4 h-4 text-red-600" />
  //   )
  // }

  const getPerformanceColor = (clicks: number) => {
    if (clicks === 0) return 'bg-red-50 text-red-700 border-red-200'
    if (clicks < 10) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    if (clicks < 50) return 'bg-blue-50 text-blue-700 border-blue-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  const filteredBankDeals = performanceData?.bankDeals.filter(deal =>
    deal.bank_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredProducts = performanceData?.products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const sortedBankDeals = [...filteredBankDeals].sort((a, b) => {
    switch (sortBy) {
      case 'clicks':
        return b.performance.totalClicks - a.performance.totalClicks
      case 'conversions':
        return b.performance.totalConversions - a.performance.totalConversions
      case 'revenue':
        return b.performance.totalRevenue - a.performance.totalRevenue
      default:
        return 0
    }
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'clicks':
        return b.performance.totalClicks - a.performance.totalClicks
      case 'conversions':
        return b.performance.totalConversions - a.performance.totalConversions
      case 'revenue':
        return b.performance.totalRevenue - a.performance.totalRevenue
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Affiliate Performance</h1>
          <p className="text-neutral-600 mt-2">Track clicks, conversions, and revenue across all affiliates</p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Search affiliates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clicks">Most Clicks</SelectItem>
                <SelectItem value="conversions">Most Conversions</SelectItem>
                <SelectItem value="revenue">Highest Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {(performanceData?.bankDeals.reduce((sum, deal) => sum + deal.performance.totalClicks, 0) || 0) +
                   (performanceData?.products.reduce((sum, product) => sum + product.performance.totalClicks, 0) || 0)}
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {(performanceData?.bankDeals.reduce((sum, deal) => sum + deal.performance.totalConversions, 0) || 0) +
                   (performanceData?.products.reduce((sum, product) => sum + product.performance.totalConversions, 0) || 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  £{((performanceData?.bankDeals.reduce((sum, deal) => sum + deal.performance.totalRevenue, 0) || 0) +
                     (performanceData?.products.reduce((sum, product) => sum + product.performance.totalRevenue, 0) || 0)).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    const totalClicks = (performanceData?.bankDeals.reduce((sum, deal) => sum + deal.performance.totalClicks, 0) || 0) +
                                      (performanceData?.products.reduce((sum, product) => sum + product.performance.totalClicks, 0) || 0)
                    const totalConversions = (performanceData?.bankDeals.reduce((sum, deal) => sum + deal.performance.totalConversions, 0) || 0) +
                                           (performanceData?.products.reduce((sum, product) => sum + product.performance.totalConversions, 0) || 0)
                    return totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'
                  })()}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Deals Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bank Deals Performance
          </CardTitle>
          <CardDescription>
            Performance metrics for bank switching deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedBankDeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No bank deals found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBankDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{deal.bank_name}</h3>
                      <Badge variant="outline">£{deal.reward_amount}</Badge>
                      <Badge className={getPerformanceColor(deal.performance.totalClicks)}>
                        {deal.performance.totalClicks === 0 ? 'No Clicks' : 
                         deal.performance.totalClicks < 10 ? 'Low Activity' :
                         deal.performance.totalClicks < 50 ? 'Moderate' : 'High Activity'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{deal.performance.totalClicks}</p>
                      <p className="text-xs text-neutral-600">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{deal.performance.totalConversions}</p>
                      <p className="text-xs text-neutral-600">Conversions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{getConversionRate(deal.performance.totalClicks, deal.performance.totalConversions)}%</p>
                      <p className="text-xs text-neutral-600">Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">£{deal.performance.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-neutral-600">Revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Products Performance
          </CardTitle>
          <CardDescription>
            Performance metrics for affiliate products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No products found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{product.product_name}</h3>
                      <p className="text-sm text-neutral-600">{product.provider_name}</p>
                      <Badge className={getPerformanceColor(product.performance.totalClicks)}>
                        {product.performance.totalClicks === 0 ? 'No Clicks' : 
                         product.performance.totalClicks < 10 ? 'Low Activity' :
                         product.performance.totalClicks < 50 ? 'Moderate' : 'High Activity'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{product.performance.totalClicks}</p>
                      <p className="text-xs text-neutral-600">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{product.performance.totalConversions}</p>
                      <p className="text-xs text-neutral-600">Conversions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{getConversionRate(product.performance.totalClicks, product.performance.totalConversions)}%</p>
                      <p className="text-xs text-neutral-600">Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">£{product.performance.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-neutral-600">Revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Optimization Suggestions
          </CardTitle>
          <CardDescription>
            Recommendations to improve affiliate performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedBankDeals.filter(deal => deal.performance.totalClicks === 0).length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>No Clicks:</strong> {sortedBankDeals.filter(deal => deal.performance.totalClicks === 0).length} bank deals have 0 clicks. Consider updating affiliate links or promoting these deals.
                </p>
              </div>
            )}
            
            {sortedProducts.filter(product => product.performance.totalClicks === 0).length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>No Clicks:</strong> {sortedProducts.filter(product => product.performance.totalClicks === 0).length} products have 0 clicks. Consider updating descriptions or promoting these products.
                </p>
              </div>
            )}

            {sortedBankDeals.filter(deal => deal.performance.totalClicks > 0 && deal.performance.totalConversions === 0).length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Low Conversion:</strong> {sortedBankDeals.filter(deal => deal.performance.totalClicks > 0 && deal.performance.totalConversions === 0).length} bank deals have clicks but no conversions. Review affiliate links and landing pages.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
