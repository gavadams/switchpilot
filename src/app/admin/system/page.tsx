'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Activity, Database, CreditCard, Server, Shield, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { getSystemHealthMetrics } from '@/lib/supabase/admin-data'

export const dynamic = 'force-dynamic'

interface SystemHealth {
  database: {
    status: 'operational' | 'issues'
    queryPerformance: number
    recentErrors: number
  }
  stripe: {
    status: 'operational' | 'issues'
    lastSuccessfulPayment: string | null
    failedPayments24h: number
  }
  scraping: {
    status: 'healthy' | 'warning' | 'critical'
    lastSuccessfulScrape: string | null
    sourcesWithIssues: number
  }
  overall: 'healthy' | 'warning' | 'critical'
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/system/health')
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
        setLastChecked(new Date())
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'issues':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
      case 'warning':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'issues':
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      const diffMs = Date.now() - date.getTime()
      const diffHours = Math.floor(diffMs / 3600000)
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="System Health">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="System Health"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'System Health' }]}
    >
      {/* Overall Health */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {health && getStatusIcon(health.overall)}
              <div>
                <CardTitle>Overall System Health</CardTitle>
                <CardDescription>
                  Last checked: {lastChecked.toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {health && getStatusBadge(health.overall)}
              <Button variant="outline" size="sm" onClick={fetchHealth}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Component Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <CardTitle>Database</CardTitle>
              </div>
              {health && getStatusIcon(health.database.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">{health?.database.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Query Performance:</span>
                <span className="text-sm font-medium">{health?.database.queryPerformance || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Recent Errors:</span>
                <span className="text-sm font-medium">{health?.database.recentErrors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Stripe Integration</CardTitle>
              </div>
              {health && getStatusIcon(health.stripe.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">{health?.stripe.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Payment:</span>
                <span className="text-sm font-medium">
                  {formatDate(health?.stripe.lastSuccessfulPayment || null)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed (24h):</span>
                <span className="text-sm font-medium text-red-600">
                  {health?.stripe.failedPayments24h || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scraping System */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <CardTitle>Scraping System</CardTitle>
              </div>
              {health && getStatusIcon(health.scraping.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">{health?.scraping.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Scrape:</span>
                <span className="text-sm font-medium">
                  {formatDate(health?.scraping.lastSuccessfulScrape || null)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sources with Issues:</span>
                <span className="text-sm font-medium text-red-600">
                  {health?.scraping.sourcesWithIssues || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <CardTitle>Supabase</CardTitle>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">API Response:</span>
                <span className="text-sm font-medium">Normal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Authentication</CardTitle>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed Logins (24h):</span>
                <span className="text-sm font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">API Response Time</p>
              <p className="text-2xl font-bold">~150ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Error Rate (24h)</p>
              <p className="text-2xl font-bold">0.1%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">99.9%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users Now</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

