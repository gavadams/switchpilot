'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/features/admin/StatCard'
import RevenueChart from '@/components/features/admin/RevenueChart'
import ActivityFeed from '@/components/features/admin/ActivityFeed'
import AlertBanner from '@/components/features/admin/AlertBanner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, ArrowRightLeft, DollarSign, Activity, Database, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalUsers: number
  activeSwitches: number
  currentMonthRevenue: number
  revenueGrowthLastMonth: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  newUsersToday: number
  newUserGrowthLastMonth: number
  completedSwitchesThisWeek: number
  failedPaymentsThisWeek: number
  stalledSwitches: number
  openSupportIssues: number
}

interface RevenueData {
  month: string
  ddRevenue: number
  affiliateRevenue: number
  total: number
}

interface ActivityItem {
  id: string
  type: 'user_registration' | 'switch_completed' | 'payment' | 'system_alert' | 'scraping' | 'affiliate'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [scrapingStats, setScrapingStats] = useState<{
    activeSources: number
    lastScrapeTime: string | null
    healthStatus: 'healthy' | 'warning' | 'critical'
  } | null>(null)
  const [affiliateStats, setAffiliateStats] = useState<{
    activeProducts: number
    totalClicks: number
    conversionRate: number
  } | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all dashboard data in parallel
      const [statsRes, revenueRes, activitiesRes, scrapingRes, affiliateRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/revenue'),
        fetch('/api/admin/dashboard/activities'),
        fetch('/api/admin/dashboard/scraping-stats'),
        fetch('/api/admin/dashboard/affiliate-stats')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (revenueRes.ok) {
        const revenueData = await revenueRes.json()
        setRevenueData(revenueData)
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData)
      }

      if (scrapingRes.ok) {
        const scrapingData = await scrapingRes.json()
        setScrapingStats(scrapingData)
      }

      if (affiliateRes.ok) {
        const affiliateData = await affiliateRes.json()
        setAffiliateStats(affiliateData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id))
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Alerts Section */}
      <div className="space-y-2 mb-6">
        {stats && stats.systemHealth !== 'healthy' && !dismissedAlerts.has('system-health') && (
          <AlertBanner
            id="system-health"
            severity={stats.systemHealth === 'critical' ? 'error' : 'warning'}
            title="System Health Alert"
            description={`System health is ${stats.systemHealth}. Please check the System Health page for details.`}
            onDismiss={handleDismissAlert}
            action={{
              label: 'View System Health',
              onClick: () => router.push('/admin/system')
            }}
          />
        )}
        {stats && stats.failedPaymentsThisWeek > 5 && !dismissedAlerts.has('failed-payments') && (
          <AlertBanner
            id="failed-payments"
            severity="warning"
            title="High Failed Payment Rate"
            description={`${stats.failedPaymentsThisWeek} payments failed this week. Review payment issues.`}
            onDismiss={handleDismissAlert}
            action={{
              label: 'View Payments',
              onClick: () => router.push('/admin/revenue')
            }}
          />
        )}
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="Registered users"
          change={stats?.newUsersToday ? {
            value: Math.round((stats.newUsersToday / (stats.totalUsers || 1)) * 100),
            label: 'new today'
          } : undefined}
          icon={<Users className="h-4 w-4" />}
          onClick={() => router.push('/admin/users')}
        />
        <StatCard
          title="Active Switches"
          value={stats?.activeSwitches || 0}
          description="Currently in progress"
          icon={<ArrowRightLeft className="h-4 w-4" />}
          onClick={() => router.push('/admin/switches')}
        />
        <StatCard
          title="Monthly Revenue"
          value={`£${(stats?.currentMonthRevenue || 0).toFixed(2)}`}
          description="This month"
          change={stats?.revenueGrowthLastMonth ? {
            value: stats.revenueGrowthLastMonth,
            label: 'vs last month'
          } : undefined}
          icon={<DollarSign className="h-4 w-4" />}
          onClick={() => router.push('/admin/revenue')}
        />
        <StatCard
          title="System Health"
          value={stats?.systemHealth || 'unknown'}
          description="Overall status"
          icon={<Activity className={`h-4 w-4 ${getSystemHealthColor(stats?.systemHealth || '')}`} />}
          onClick={() => router.push('/admin/system')}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newUsersToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedSwitchesThisWeek || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failedPaymentsThisWeek || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Support Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openSupportIssues || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Integration Cards - Scraping & Affiliates */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Scraping System Overview */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/scraping')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Scraping System</span>
              </CardTitle>
              <Link href="/admin/scraping">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Deal scraping management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Sources:</span>
                <span className="font-medium">{scrapingStats?.activeSources || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Scrape:</span>
                <span className="font-medium">
                  {scrapingStats?.lastScrapeTime ? (() => {
                    try {
                      const date = new Date(scrapingStats.lastScrapeTime)
                      if (isNaN(date.getTime())) return 'Never'
                      const diffMs = Date.now() - date.getTime()
                      const diffHours = Math.floor(diffMs / 3600000)
                      if (diffHours < 1) return 'Just now'
                      if (diffHours < 24) return `${diffHours}h ago`
                      return date.toLocaleDateString()
                    } catch {
                      return 'Never'
                    }
                  })() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Health:</span>
                <span className={`font-medium ${getSystemHealthColor(scrapingStats?.healthStatus || '')}`}>
                  {scrapingStats?.healthStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate System Overview */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/affiliates')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Affiliate System</span>
              </CardTitle>
              <Link href="/admin/affiliates">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Affiliate tracking & management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Products:</span>
                <span className="font-medium">{affiliateStats?.activeProducts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Clicks This Month:</span>
                <span className="font-medium">{affiliateStats?.totalClicks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                <span className="font-medium">{affiliateStats?.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" onClick={() => router.push('/admin/users')} className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/revenue')} className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/system')} className="justify-start">
              <Activity className="mr-2 h-4 w-4" />
              System Health
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/scraping')} className="justify-start">
              <Database className="mr-2 h-4 w-4" />
              Scraping Management
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/affiliates')} className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Affiliate Management
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/deals')} className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Deals Management
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/support')} className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Support Tools
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/audit')} className="justify-start">
              <Activity className="mr-2 h-4 w-4" />
              Audit Log
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

