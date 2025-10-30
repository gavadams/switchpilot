'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Activity } from 'lucide-react'
import Link from 'next/link'
import ScrapeProgress from '../../../components/features/admin/ScrapeProgress'
import HealthStatusBadge from '../../../components/features/admin/HealthStatusBadge'
import { ScrapingSource, SyncResult, HealthStatus } from '@/types/scraping'

export const dynamic = 'force-dynamic'

export default function ScrapingDashboardPage() {
  const [sources, setSources] = useState<ScrapingSource[]>([])
  const [overallHealth, setOverallHealth] = useState<{
    overall: 'healthy' | 'warning' | 'critical'
    sources: HealthStatus[]
    issues: string[]
  } | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeResults, setScrapeResults] = useState<SyncResult[]>([])
  const [loading, setLoading] = useState(true)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sourcesRes, healthRes, logsRes] = await Promise.all([
        fetch('/api/admin/scraping-sources'),
        fetch('/api/admin/scraping/health'),
        fetch('/api/admin/scraping/logs?limit=5')
      ])

      if (sourcesRes.ok) {
        const { sources: sourcesData } = await sourcesRes.json()
        setSources(sourcesData || [])
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setOverallHealth(healthData)
      }

      if (logsRes.ok) {
        const { logs } = await logsRes.json()
        setRecentLogs(logs || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeAll = async () => {
    setIsScraping(true)
    setScrapeResults([])

    try {
      const response = await fetch('/api/admin/scrape', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setScrapeResults(result.results || [])
        // Refresh data after scraping
        setTimeout(() => {
          fetchData()
        }, 1000)
      }
    } catch (error) {
      console.error('Error scraping:', error)
    } finally {
      setIsScraping(false)
    }
  }

  const activeSources = sources.filter(s => s.is_active)
  const totalDeals = sources.reduce((sum, s) => sum + (s.last_scrape_deals_found || 0), 0)
  const lastScrapeTime = sources
    .filter(s => s.last_scraped_at)
    .sort((a, b) => new Date(b.last_scraped_at!).getTime() - new Date(a.last_scraped_at!).getTime())[0]
    ?.last_scraped_at

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Scraping Dashboard</h2>
          <p className="text-muted-foreground">Manage and monitor deal scraping from multiple sources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/admin/scraping/sources">
            <Button variant="outline">Manage Sources</Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSources.length}</div>
            <p className="text-xs text-muted-foreground">out of {sources.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-muted-foreground">across all sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Scrape</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastScrapeTime
                ? new Date(lastScrapeTime).toLocaleDateString()
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastScrapeTime
                ? new Date(lastScrapeTime).toLocaleTimeString()
                : 'No scrapes yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overallHealth && (
              <HealthStatusBadge
                health={{
                  sourceId: 'overall',
                  sourceName: 'Overall',
                  status: overallHealth.overall,
                  successRate: 0,
                  averageDealsFound: 0,
                  lastSuccessAt: null,
                  consecutiveFailures: 0,
                  issues: overallHealth.issues
                }}
              />
            )}
            {overallHealth?.issues.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {overallHealth.issues.length} issue(s) detected
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scrape All Button */}
      <Card>
        <CardHeader>
          <CardTitle>Scrape All Sources</CardTitle>
          <CardDescription>Run scraping for all active sources</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleScrapeAll} disabled={isScraping} size="lg" className="w-full">
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping in progress...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scrape All Sources Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scrape Progress */}
      {(isScraping || scrapeResults.length > 0) && (
        <ScrapeProgress
          isRunning={isScraping}
          results={scrapeResults}
          totalSources={activeSources.length}
        />
      )}

      {/* Sources Quick View */}
      <Card>
        <CardHeader>
          <CardTitle>Sources Overview</CardTitle>
          <CardDescription>Quick view of all scraping sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map(source => (
              <div key={source.id} className="border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{source.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${source.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {source.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Priority: {source.priority}</div>
                  <div>Last: {source.last_scraped_at ? new Date(source.last_scraped_at).toLocaleDateString() : 'Never'}</div>
                  <div>Deals: {source.last_scrape_deals_found || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scraping Activity</CardTitle>
          <CardDescription>Last 5 scraping operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No scraping activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{log.source_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.deals_found} deals found • {log.deals_added} added • {log.deals_updated} updated
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${log.status === 'success' ? 'bg-green-100 text-green-700' : log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link href="/admin/scraping/logs">
              <Button variant="outline" size="sm">View All Logs</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

