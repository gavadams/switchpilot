'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/features/admin/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ArrowRightLeft, CheckCircle, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Switch {
  id: string
  user_id: string
  deal_id: string
  status: string
  started_at: string
  completed_at: string | null
  earnings_received: number
  bank_deals?: { bank_name: string; reward_amount: number } | null
  profiles?: { email: string; full_name: string | null } | null
}

export default function SwitchesMonitoringPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [switches, setSwitches] = useState<Switch[]>([])
  const [stuckSwitches, setStuckSwitches] = useState<Switch[]>([])
  const [stats, setStats] = useState({
    activeSwitches: 0,
    completedThisMonth: 0,
    avgCompletionTime: 0,
    successRate: 0
  })
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'started' | 'in_progress' | 'completed' | 'failed' | 'stuck'
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchSwitches()
    fetchStuckSwitches()
    fetchStats()
  }, [page, filters])

  const fetchSwitches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        status: filters.status
      })

      const res = await fetch(`/api/admin/switches?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSwitches(data.switches || [])
      }
    } catch (error) {
      console.error('Error fetching switches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStuckSwitches = async () => {
    try {
      const res = await fetch('/api/admin/switches/stuck')
      if (res.ok) {
        const data = await res.json()
        setStuckSwitches(data.switches || [])
      }
    } catch (error) {
      console.error('Error fetching stuck switches:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/switches/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          activeSwitches: data.activeSwitches || 0,
          completedThisMonth: data.completedThisMonth || 0,
          avgCompletionTime: data.avgCompletionTime || 0,
          successRate: data.successRate || 0
        })
      }
    } catch (error) {
      console.error('Error fetching switch stats:', error)
      // Fallback to calculating from switches data
      const active = switches.filter(s => s.status !== 'completed' && s.status !== 'failed').length
      const completed = switches.filter(s => s.status === 'completed').length
      const total = switches.length
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

      setStats({
        activeSwitches: active,
        completedThisMonth: completed,
        avgCompletionTime: 0,
        successRate
      })
    }
  }

  const handleCompleteSwitch = async (switchId: string) => {
    if (!confirm('Are you sure you want to manually complete this switch?')) return

    try {
      const res = await fetch(`/api/admin/switches/${switchId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earnings: 0 })
      })

      if (res.ok) {
        fetchSwitches()
        fetchStuckSwitches()
      }
    } catch (error) {
      console.error('Error completing switch:', error)
      alert('Failed to complete switch')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  const getDaysStuck = (startedAt: string) => {
    const days = Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <DashboardLayout
      title="Switches Monitoring"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Switches' }]}
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Active Switches"
          value={stats.activeSwitches}
          icon={<ArrowRightLeft className="h-4 w-4" />}
        />
        <StatCard
          title="Completed This Month"
          value={stats.completedThisMonth}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Stuck Switches"
          value={stuckSwitches.length}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      {/* Stuck Switches Section */}
      {stuckSwitches.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span>Stuck Switches</span>
            </CardTitle>
            <CardDescription>Switches with no progress in 7+ days</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Days Stuck</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stuckSwitches.map((switchItem) => (
                  <TableRow key={switchItem.id}>
                    <TableCell>
                      {switchItem.profiles?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {switchItem.bank_deals?.bank_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(switchItem.started_at)}</TableCell>
                    <TableCell>{getDaysStuck(switchItem.started_at)} days</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${switchItem.user_id}`)}
                        >
                          View User
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteSwitch(switchItem.id)}
                        >
                          Complete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Switches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Switches</CardTitle>
              <CardDescription>Monitor all user switches</CardDescription>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value: 'all' | 'started' | 'in_progress' | 'completed' | 'failed' | 'stuck') => {
                setFilters({ ...filters, status: value })
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="stuck">Stuck</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : switches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No switches found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {switches.map((switchItem) => (
                  <TableRow key={switchItem.id}>
                    <TableCell>
                      {switchItem.profiles?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {switchItem.bank_deals?.bank_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        switchItem.status === 'completed' ? 'default' :
                        switchItem.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {switchItem.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(switchItem.started_at)}</TableCell>
                    <TableCell>{formatDate(switchItem.completed_at)}</TableCell>
                    <TableCell>£{switchItem.earnings_received.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${switchItem.user_id}`)}
                        >
                          View User
                        </Button>
                        {switchItem.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteSwitch(switchItem.id)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

