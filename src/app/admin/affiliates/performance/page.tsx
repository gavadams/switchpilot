// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

// Performance data interface
interface PerformanceItem {
    id: string
  name: string
  type: 'bank_deal' | 'product'
  clicks: number
  conversions: number
  revenue: number
}

export default function AdminPerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/admin/affiliates/performance')

      if (!res.ok) throw new Error('Failed to fetch performance data')

      const data = await res.json()
      setPerformanceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (performanceData.length === 0) return

    const csvContent = [
      'Type,Name,Clicks,Conversions,Conversion Rate,Revenue',
      ...performanceData.map(item =>
        `${item.type},${item.name},${item.clicks},${item.conversions},${item.clicks > 0 ? ((item.conversions / item.clicks) * 100).toFixed(1) : '0.0'}%,£${item.revenue.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `affiliate-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalClicks = performanceData.reduce((sum, item) => sum + item.clicks, 0)
  const totalConversions = performanceData.reduce((sum, item) => sum + item.conversions, 0)
  const totalRevenue = performanceData.reduce((sum, item) => sum + item.revenue, 0)
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
        </div>
          </CardContent>
        </Card>
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
        <Button onClick={handleExportCSV} variant="outline" disabled={performanceData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
              <MousePointerClick className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Conversion Rate</p>
                <p className="text-2xl font-bold">{avgConversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Details</CardTitle>
          <CardDescription>Detailed performance metrics for each affiliate</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No performance data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Clicks</th>
                    <th className="text-left p-4 font-medium">Conversions</th>
                    <th className="text-left p-4 font-medium">Conversion Rate</th>
                    <th className="text-left p-4 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {item.type === 'bank_deal' ? 'Bank Deal' : 'Product'}
                      </Badge>
                      </td>
                      <td className="p-4">{item.clicks}</td>
                      <td className="p-4">{item.conversions}</td>
                      <td className="p-4">
                        {item.clicks > 0 ? ((item.conversions / item.clicks) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td className="p-4">£{item.revenue.toFixed(2)}</td>
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