'use client'

// Admin scraping analytics page - View scraping performance and statistics

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import { ScrapingLog } from '@/types/scraping'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  totalScrapes: number
  successfulScrapes: number
  failedScrapes: number
  totalDealsFound: number
  totalDealsAdded: number
  averageDealsPerScrape: number
  successRate: number
  sourceStats: Array<{
    sourceName: string
    scrapes: number
    successRate: number
    totalDeals: number
    averageDeals: number
  }>
  dailyStats: Array<{
    date: string
    scrapes: number
    dealsFound: number
    dealsAdded: number
  }>
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [dateRange])

  useEffect(() => {
    if (logs.length > 0) {
      calculateAnalytics()
    }
  }, [logs])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case 'all':
          startDate.setFullYear(2020) // Far back date
          break
      }

      const url = `/api/admin/scraping/logs?startDate=${startDate.toISOString()}&endDate=${endDate}&limit=1000`
      const response = await fetch(url, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        console.error('Failed to fetch logs:', response.status)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = () => {
    const successfulScrapes = logs.filter(log => log.status === 'success').length
    const failedScrapes = logs.filter(log => log.status === 'failed').length
    const totalDealsFound = logs.reduce((sum, log) => sum + (log.deals_found || 0), 0)
    const totalDealsAdded = logs.reduce((sum, log) => sum + (log.deals_added || 0), 0)
    const averageDealsPerScrape = logs.length > 0 ? totalDealsFound / logs.length : 0
    const successRate = logs.length > 0 ? (successfulScrapes / logs.length) * 100 : 0

    // Source statistics
    const sourceMap = new Map<string, { scrapes: number; successes: number; deals: number }>()
    logs.forEach(log => {
      const sourceName = log.source_name || 'Unknown'
      const existing = sourceMap.get(sourceName) || { scrapes: 0, successes: 0, deals: 0 }
      existing.scrapes++
      if (log.status === 'success') existing.successes++
      existing.deals += log.deals_found || 0
      sourceMap.set(sourceName, existing)
    })

    const sourceStats = Array.from(sourceMap.entries()).map(([sourceName, stats]) => ({
      sourceName,
      scrapes: stats.scrapes,
      successRate: stats.scrapes > 0 ? (stats.successes / stats.scrapes) * 100 : 0,
      totalDeals: stats.deals,
      averageDeals: stats.scrapes > 0 ? stats.deals / stats.scrapes : 0
    }))

    // Daily statistics
    const dailyMap = new Map<string, { scrapes: number; dealsFound: number; dealsAdded: number }>()
    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { scrapes: 0, dealsFound: 0, dealsAdded: 0 }
      existing.scrapes++
      existing.dealsFound += log.deals_found || 0
      existing.dealsAdded += log.deals_added || 0
      dailyMap.set(date, existing)
    })

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setAnalytics({
      totalScrapes: logs.length,
      successfulScrapes,
      failedScrapes,
      totalDealsFound,
      totalDealsAdded,
      averageDealsPerScrape,
      successRate,
      sourceStats,
      dailyStats
    })
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analytics data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Scraping Analytics</h2>
        <p className="text-muted-foreground">View scraping performance and statistics</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Date Range</CardTitle>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scrapes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalScrapes}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.successfulScrapes} successful, {analytics.failedScrapes} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {analytics.successRate >= 80 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.successfulScrapes} of {analytics.totalScrapes} scrapes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals Found</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDealsFound}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageDealsPerScrape.toFixed(1)} avg per scrape
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Added</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDealsAdded}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalDealsFound > 0 
                ? ((analytics.totalDealsAdded / analytics.totalDealsFound) * 100).toFixed(1) 
                : 0}% of found deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Source Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Compare scraping performance by source</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.sourceStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No source data available</div>
          ) : (
            <div className="space-y-4">
              {analytics.sourceStats.map((source) => (
                <div key={source.sourceName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{source.sourceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.successRate.toFixed(1)}% success rate
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Scrapes</div>
                      <div className="font-medium">{source.scrapes}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Deals</div>
                      <div className="font-medium">{source.totalDeals}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg per Scrape</div>
                      <div className="font-medium">{source.averageDeals.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Statistics</CardTitle>
          <CardDescription>Scraping activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.dailyStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No daily data available</div>
          ) : (
            <div className="space-y-2">
              {analytics.dailyStats.slice(-14).map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded">
                  <div className="font-medium">
                    {new Date(day.date).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Scrapes: </span>
                      <span className="font-medium">{day.scrapes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Found: </span>
                      <span className="font-medium">{day.dealsFound}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Added: </span>
                      <span className="font-medium text-green-600">{day.dealsAdded}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

