'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AffiliatePerformance, DateRange } from '@/types'
import DateRangeSelector from '@/components/features/admin/DateRangeSelector'
import PerformanceCard from '@/components/features/admin/PerformanceCard'
import { 
  Loader2, 
  AlertCircle, 
  MousePointerClick, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Download,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface PerformanceSummary {
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  avgConversionRate: number
}

export default function AdminPerformancePage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [performance, setPerformance] = useState<AffiliatePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  })
  const [sortField, setSortField] = useState<keyof AffiliatePerformance>('revenue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchPerformance()
  }, [dateRange])

  const fetchPerformance = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const res = await fetch(`/api/admin/affiliates/performance?${params}`)
      
      if (!res.ok) throw new Error('Failed to fetch performance data')

      const data = await res.json()
      setSummary(data.summary)
      setPerformance(data.performance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const handleSort = (field: keyof AffiliatePerformance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedPerformance = [...performance].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    const aStr = String(aValue)
    const bStr = String(bValue)
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
  })

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Clicks', 'Conversions', 'Revenue', 'Conversion Rate']
    const rows = sortedPerformance.map(item => [
      item.name,
      item.type === 'bank_deal' ? 'Bank Deal' : 'Affiliate Product',
      item.clicks,
      item.conversions,
      `£${item.revenue.toFixed(2)}`,
      `${item.conversionRate.toFixed(2)}%`
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `affiliate-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && !summary) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/affiliates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Affiliate Performance</h1>
            <p className="text-muted-foreground">Track clicks, conversions, and revenue</p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={performance.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PerformanceCard
            title="Total Clicks"
            value={summary.totalClicks.toLocaleString()}
            icon={MousePointerClick}
            iconColor="text-blue-600"
          />
          <PerformanceCard
            title="Conversions"
            value={summary.totalConversions.toLocaleString()}
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <PerformanceCard
            title="Total Revenue"
            value={`£${summary.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            iconColor="text-purple-600"
          />
          <PerformanceCard
            title="Avg Conversion Rate"
            value={`${summary.avgConversionRate.toFixed(2)}%`}
            icon={TrendingUp}
            iconColor="text-orange-600"
          />
        </div>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Performance Details</CardTitle>
          <CardDescription>
            Performance metrics for each affiliate link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : performance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No performance data available for the selected date range
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th 
                      className="p-4 text-left font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="p-4 text-left font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('type')}
                    >
                      Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="p-4 text-right font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('clicks')}
                    >
                      Clicks {sortField === 'clicks' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="p-4 text-right font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('conversions')}
                    >
                      Conversions {sortField === 'conversions' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="p-4 text-right font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="p-4 text-right font-medium cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('conversionRate')}
                    >
                      Conv. Rate {sortField === 'conversionRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPerformance.map(item => (
                    <tr key={`${item.type}_${item.id}`} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={item.type === 'bank_deal' ? 'default' : 'secondary'}>
                          {item.type === 'bank_deal' ? 'Bank Deal' : 'Product'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">{item.clicks.toLocaleString()}</td>
                      <td className="p-4 text-right">{item.conversions.toLocaleString()}</td>
                      <td className="p-4 text-right font-medium">£{item.revenue.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <Badge 
                          variant={item.conversionRate > 5 ? 'default' : 'secondary'}
                        >
                          {item.conversionRate.toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

