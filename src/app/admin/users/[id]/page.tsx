'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Loader2, ArrowLeft, Mail, Ban, CheckCircle } from 'lucide-react'
import { Profile, UserSwitch, DirectDebit, AffiliateClick, DdPayment } from '@/types/database'

export const dynamic = 'force-dynamic'

interface UserSwitchWithDeal extends UserSwitch {
  bank_deals?: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
    required_direct_debits: number
    affiliate_url: string | null
  } | null
}

interface UserDetail {
  profile: Profile
  switches: UserSwitchWithDeal[]
  directDebits: DirectDebit[]
  affiliateClicks: AffiliateClick[]
  payments: DdPayment[]
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [suspending, setSuspending] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
    }
  }, [userId])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUserDetail(data)
      } else {
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
      router.push('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendToggle = async (suspended: boolean) => {
    if (!confirm(`Are you sure you want to ${suspended ? 'suspend' : 'unsuspend'} this user?`)) {
      return
    }

    try {
      setSuspending(true)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_suspended: suspended,
          suspension_reason: suspended ? 'Suspended by admin' : null,
          suspended_until: null
        })
      })

      if (res.ok) {
        fetchUserDetail()
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    } finally {
      setSuspending(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="User Detail">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!userDetail) {
    return (
      <DashboardLayout title="User Not Found">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button onClick={() => router.push('/admin/users')} className="mt-4">
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const { profile, switches, directDebits, affiliateClicks, payments } = userDetail
  const activeSwitches = switches.filter(s => s.status !== 'completed' && s.status !== 'failed').length
  const activeDDs = directDebits.filter(dd => dd.status === 'active').length

  return (
    <DashboardLayout
      title={profile.full_name || profile.email}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Users', href: '/admin/users' },
        { label: profile.email }
      ]}
    >
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      {/* User Info Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Account details and status</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Suspended:</span>
                <Switch
                  checked={profile.is_suspended || false}
                  onCheckedChange={handleSuspendToggle}
                  disabled={suspending}
                />
              </div>
              {profile.is_suspended && (
                <Badge variant="destructive">Suspended</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-sm font-medium">{profile.full_name || '—'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
              <p className="text-sm font-medium">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe Customer ID</label>
              <p className="text-sm font-medium">
                {userDetail?.directDebits.find(dd => dd.stripe_customer_id)?.stripe_customer_id || '—'}
              </p>
            </div>
            {profile.is_suspended && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Suspension Reason</label>
                  <p className="text-sm font-medium">{profile.suspension_reason || '—'}</p>
                </div>
                {profile.suspended_until && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Suspended Until</label>
                    <p className="text-sm font-medium">{formatDate(profile.suspended_until)}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Switches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{switches.length}</div>
            <p className="text-xs text-muted-foreground">{activeSwitches} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{profile.total_earnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active DDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDDs}</div>
            <p className="text-xs text-muted-foreground">of {directDebits.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateClicks.length}</div>
            <p className="text-xs text-muted-foreground">
              {affiliateClicks.filter(c => c.status === 'converted').length} converted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="switches">Switches ({switches.length})</TabsTrigger>
          <TabsTrigger value="direct-debits">Direct Debits ({directDebits.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate Activity ({affiliateClicks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Account Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(profile.created_at)}</p>
                </div>
                {switches.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">First Switch Started</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(switches[switches.length - 1]?.started_at)}
                    </p>
                  </div>
                )}
                {switches.some(s => s.status === 'completed') && (
                  <div>
                    <p className="text-sm font-medium">Last Switch Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(switches.find(s => s.status === 'completed')?.completed_at || null)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="switches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Switches</CardTitle>
            </CardHeader>
            <CardContent>
              {switches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No switches found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {switches.map((switchItem) => (
                      <TableRow key={switchItem.id}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct-debits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Debits</CardTitle>
            </CardHeader>
            <CardContent>
              {directDebits.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No direct debits found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Setup Date</TableHead>
                      <TableHead>Next Collection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directDebits.map((dd) => (
                      <TableRow key={dd.id}>
                        <TableCell>{dd.provider}</TableCell>
                        <TableCell>£{dd.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            dd.status === 'active' ? 'default' :
                            dd.status === 'cancelled' ? 'destructive' : 'secondary'
                          }>
                            {dd.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(dd.setup_date)}</TableCell>
                        <TableCell>{formatDate(dd.next_collection_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payments found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>Direct Debit</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {affiliateClicks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No affiliate activity found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliateClicks.map((click) => (
                      <TableRow key={click.id}>
                        <TableCell>{formatDate(click.click_timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant={click.status === 'converted' ? 'default' : 'secondary'}>
                            {click.status}
                          </Badge>
                        </TableCell>
                        <TableCell>£{click.commission_earned.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

