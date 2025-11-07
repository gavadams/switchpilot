'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/features/admin/StatCard'
import RevenueChart from '@/components/features/admin/RevenueChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Loader2, DollarSign, TrendingUp, Download } from 'lucide-react'
import { getRevenueMetrics, getRevenueOverTime } from '@/lib/supabase/admin-data'

export const dynamic = 'force-dynamic'

const COLORS = ['#10b981', '#3b82f6']

interface RevenueMetrics {
  totalRevenue: number
  monthlyRecurringRevenue: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  averageRevenuePerUser: number
  ddRevenue: number
  affiliateRevenue: number
  ddRevenuePercentage: number
  affiliateRevenuePercentage: number
}

interface RevenueDataPoint {
  month: string
  ddRevenue: number
  affiliateRevenue: number
  total: number
}

export default function RevenueDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [dateRange, setDateRange] = useState('12')

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [metricsRes, revenueRes] = await Promise.all([
        fetch('/api/admin/revenue/metrics'),
        fetch(`/api/admin/revenue/over-time?months=${dateRange}`)
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (revenueRes.ok) {
        const revenueData = await revenueRes.json()
        setRevenueData(revenueData)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/revenue/export?format=csv&months=${dateRange}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting revenue:', error)
      alert('Failed to export revenue data')
    }
  }

  const pieData = metrics ? [
    { name: 'Direct Debits', value: metrics.ddRevenue },
    { name: 'Affiliate', value: metrics.affiliateRevenue }
  ] : []

  if (loading) {
    return (
      <DashboardLayout title="Revenue Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Revenue Dashboard"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue' }]}
    >
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard
          title="Total Revenue"
          value={`£${(metrics?.totalRevenue || 0).toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="MRR"
          value={`£${(metrics?.monthlyRecurringRevenue || 0).toFixed(2)}`}
          description="Monthly Recurring Revenue"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="This Month"
          value={`£${(metrics?.thisMonthRevenue || 0).toFixed(2)}`}
          change={metrics?.lastMonthRevenue ? {
            value: metrics.lastMonthRevenue > 0
              ? Math.round(((metrics.thisMonthRevenue - metrics.lastMonthRevenue) / metrics.lastMonthRevenue) * 100)
              : 0,
            label: 'vs last month'
          } : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="ARPU"
          value={`£${(metrics?.averageRevenuePerUser || 0).toFixed(2)}`}
          description="Average Revenue Per User"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <div className="flex items-center">
          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>DD vs Affiliate revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Direct Debits</p>
                <p className="text-2xl font-bold">£{metrics?.ddRevenue.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.ddRevenuePercentage.toFixed(1) || '0'}% of total
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Affiliate</p>
                <p className="text-2xl font-bold">£{metrics?.affiliateRevenue.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.affiliateRevenuePercentage.toFixed(1) || '0'}% of total
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { name: string; percent: number }) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Over Time</CardTitle>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} height={200} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

