// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '../../context/AuthContext'
import { AffiliateClick, getAffiliateClicks, getAffiliateStats } from '../../lib/supabase/affiliates-client'
import { 
  CheckCircle,
  ExternalLink,
  Download,
  Search,
  BarChart3,
  Clock
} from 'lucide-react'

export default function AffiliateTrackingPage() {
  const { user } = useAuth()
  const [clicks, setClicks] = useState<AffiliateClick[]>([])
  const [stats, setStats] = useState<{
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    bankDealClicks: number;
    productClicks: number;
    bankDealConversions: number;
    productConversions: number;
    bankDealRevenue: number;
    productRevenue: number;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        const [clicksData, statsData] = await Promise.all([
          getAffiliateClicks(user.id),
          getAffiliateStats(user.id)
        ])
        
        setClicks(clicksData)
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load affiliate data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  const getProviderName = (click: AffiliateClick) => {
    if (click.bank_deals) {
      return click.bank_deals.affiliate_provider
    } else if (click.affiliate_products) {
      return click.affiliate_products.affiliate_provider
    }
    return 'Unknown'
  }

  // Filter clicks based on search and filters
  const filteredClicks = clicks.filter(click => {
    const name = getClickName(click).toLowerCase()
    const searchMatch = !searchTerm || name.includes(searchTerm.toLowerCase())
    const typeMatch = typeFilter === 'all' || click.click_type === typeFilter
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'converted' && click.converted) ||
      (statusFilter === 'pending' && !click.converted)
    
    return searchMatch && typeMatch && statusMatch
  })

  const exportToCSV = () => {
    const csvData = filteredClicks.map(click => ({
      Type: getClickTypeLabel(click.click_type),
      Name: getClickName(click),
      Provider: getProviderName(click),
      'Clicked Date': formatDate(click.clicked_at),
      Status: click.converted ? 'Converted' : 'Pending',
      'Commission Earned': click.commission_earned || 0
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `affiliate-clicks-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-neutral-600">Loading affiliate data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
            Affiliate Tracking
          </h1>
        </div>
        
        <Card className="card-professional border-0">
          <CardContent className="text-center py-12">
            <p className="text-neutral-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
          Affiliate Tracking
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Track all your affiliate clicks and conversions in one place
        </p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-professional border-0">
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">{stats.totalClicks}</div>
              <p className="text-sm font-medium text-neutral-600">Total Clicks</p>
            </CardContent>
          </Card>
          
          <Card className="card-professional border-0">
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-success-600 mb-2">{stats.totalConversions}</div>
              <p className="text-sm font-medium text-neutral-600">Conversions</p>
            </CardContent>
          </Card>
          
          <Card className="card-professional border-0">
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-accent-600 mb-2">
                {stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm font-medium text-neutral-600">Conversion Rate</p>
            </CardContent>
          </Card>
          
          <Card className="card-professional border-0">
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-success-600 mb-2">£{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-sm font-medium text-neutral-600">Total Earned</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="card-professional border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bank_deal">Bank Deals</SelectItem>
                  <SelectItem value="affiliate_product">Products</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clicks Table */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            All Clicks ({filteredClicks.length})
          </CardTitle>
          <CardDescription>
            Complete history of your affiliate clicks and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClicks.length > 0 ? (
            <div className="space-y-3">
              {filteredClicks.map((click) => (
                <div key={click.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className={click.click_type === 'bank_deal' ? 'bg-primary-50 text-primary-700' : 'bg-accent-50 text-accent-700'}
                    >
                      {getClickTypeLabel(click.click_type)}
                    </Badge>
                    
                    <div>
                      <div className="font-medium text-neutral-800">{getClickName(click)}</div>
                      <div className="text-sm text-neutral-600">{getProviderName(click)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-neutral-600">{formatDate(click.clicked_at)}</div>
                      {click.converted && (
                        <div className="text-xs text-success-600 font-medium">
                          +£{click.commission_earned || 0} earned
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {click.converted ? (
                        <Badge className="bg-success-100 text-success-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Converted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">No clicks found</h3>
              <p className="text-neutral-600 mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start clicking affiliate links to see them here'
                }
              </p>
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <a href="/affiliate-products">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Browse Products
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
