'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Shield, AlertTriangle, Ban, XCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export const dynamic = 'force-dynamic'

interface FlaggedAccount {
  userId: string
  email: string
  riskLevel: 'high' | 'medium' | 'low'
  reason: string
  flaggedDate: string
  status: 'under_review' | 'cleared' | 'banned'
}

export default function FraudDetectionPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>([])
  const [stats, setStats] = useState({
    highRisk: 0,
    suspiciousActivity: 0,
    underReview: 0
  })
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FlaggedAccount | null>(null)
  const [banData, setBanData] = useState({ reason: '', blockIp: false, blockPaymentMethod: false })
  const [suspendData, setSuspendData] = useState({ reason: '', duration: 30 })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchFlaggedAccounts()
  }, [])

  const fetchFlaggedAccounts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/fraud/flagged')
      if (res.ok) {
        const data = await res.json()
        setFlaggedAccounts(data.accounts || [])
        
        // Calculate stats
        const highRisk = data.accounts.filter((a: FlaggedAccount) => a.riskLevel === 'high').length
        const underReview = data.accounts.filter((a: FlaggedAccount) => a.status === 'under_review').length
        setStats({
          highRisk,
          suspiciousActivity: data.accounts.length,
          underReview
        })
      }
    } catch (error) {
      console.error('Error fetching flagged accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async () => {
    if (!selectedUser || !banData.reason) {
      addToast({
        title: 'Error',
        description: 'Reason is required',
        variant: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const res = await fetch('/api/admin/fraud/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          ...banData
        })
      })

      if (res.ok) {
        addToast({
          title: 'Success',
          description: 'User banned successfully',
          variant: 'success'
        })
        setBanDialogOpen(false)
        setSelectedUser(null)
        fetchFlaggedAccounts()
      } else {
        const error = await res.json()
        addToast({
          title: 'Error',
          description: error.error || 'Failed to ban user',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error banning user:', error)
      addToast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleSuspend = async () => {
    if (!selectedUser || !suspendData.reason) {
      addToast({
        title: 'Error',
        description: 'Reason is required',
        variant: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const res = await fetch('/api/admin/fraud/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          ...suspendData
        })
      })

      if (res.ok) {
        addToast({
          title: 'Success',
          description: 'User suspended successfully',
          variant: 'success'
        })
        setSuspendDialogOpen(false)
        setSelectedUser(null)
        fetchFlaggedAccounts()
      } else {
        const error = await res.json()
        addToast({
          title: 'Error',
          description: error.error || 'Failed to suspend user',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      addToast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleClearFlag = async (userId: string) => {
    if (!confirm('Are you sure you want to clear this fraud flag?')) return

    try {
      const res = await fetch('/api/admin/fraud/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason: 'Flag cleared by admin' })
      })

      if (res.ok) {
        addToast({
          title: 'Success',
          description: 'Fraud flag cleared',
          variant: 'success'
        })
        fetchFlaggedAccounts()
      }
    } catch (error) {
      console.error('Error clearing flag:', error)
      addToast({
        title: 'Error',
        description: 'Failed to clear flag',
        variant: 'error'
      })
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>
      case 'medium':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
      case 'low':
        return <Badge variant="secondary">Low Risk</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <DashboardLayout
      title="Fraud & Abuse Detection"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fraud Detection' }]}
    >
      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspiciousActivity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detection Rules</CardTitle>
          <CardDescription>Configure fraud detection rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Multiple Accounts</p>
                <p className="text-sm text-muted-foreground">
                  Same payment method or IP address used by multiple users
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Rapid Activity</p>
                <p className="text-sm text-muted-foreground">
                  5+ switches in 24 hours or 20+ affiliate clicks in 1 hour
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Failed Payments</p>
                <p className="text-sm text-muted-foreground">
                  Multiple failed payment attempts or high decline rate
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Refund Abuse</p>
                <p className="text-sm text-muted-foreground">
                  Pattern of request-refund cycle detection
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flagged Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Accounts</CardTitle>
          <CardDescription>Accounts flagged for suspicious activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : flaggedAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No flagged accounts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Flagged Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedAccounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell>{getRiskBadge(account.riskLevel)}</TableCell>
                    <TableCell>{account.reason}</TableCell>
                    <TableCell>{formatDate(account.flaggedDate)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        account.status === 'banned' ? 'destructive' :
                        account.status === 'under_review' ? 'default' : 'secondary'
                      }>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/users/${account.userId}`)}
                        >
                          Investigate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(account)
                            setBanDialogOpen(true)
                          }}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(account)
                            setSuspendDialogOpen(true)
                          }}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearFlag(account.userId)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-white border-neutral-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Ban User Account</DialogTitle>
            <DialogDescription>
              Permanently ban this user account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={banData.reason}
                onChange={(e) => setBanData({ ...banData, reason: e.target.value })}
                placeholder="Reason for ban..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={banData.blockIp}
                onChange={(e) => setBanData({ ...banData, blockIp: e.target.checked })}
              />
              <Label>Block IP Address</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={banData.blockPaymentMethod}
                onChange={(e) => setBanData({ ...banData, blockPaymentMethod: e.target.checked })}
              />
              <Label>Block Payment Method</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBan} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ban User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="bg-white border-neutral-200 shadow-xl">
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              Temporarily suspend this user account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={suspendData.reason}
                onChange={(e) => setSuspendData({ ...suspendData, reason: e.target.value })}
                placeholder="Reason for suspension..."
                rows={3}
              />
            </div>
            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={suspendData.duration}
                onChange={(e) => setSuspendData({ ...suspendData, duration: parseInt(e.target.value) || 30 })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSuspend} disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Suspend User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

