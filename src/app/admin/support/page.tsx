'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, DollarSign, Mail, Key, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export const dynamic = 'force-dynamic'

export default function SupportToolsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Support action states
  const [refundData, setRefundData] = useState({ userId: '', amount: 0, reason: '', paymentId: '' })
  const [creditData, setCreditData] = useState({ userId: '', amount: 0, reason: '' })
  const [emailData, setEmailData] = useState({ email: '', subject: '', message: '' })
  const [passwordResetEmail, setPasswordResetEmail] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleUserSearch = async () => {
    if (!userSearch) return

    try {
      setSearching(true)
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleIssueRefund = async () => {
    if (!refundData.userId || !refundData.amount) {
      addToast({
        title: 'Error',
        description: 'User ID and amount are required',
        variant: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const res = await fetch('/api/admin/support/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundData)
      })

      if (res.ok) {
        addToast({
          title: 'Success',
          description: 'Refund issued successfully',
          variant: 'success'
        })
        setRefundData({ userId: '', amount: 0, reason: '', paymentId: '' })
      } else {
        const error = await res.json()
        addToast({
          title: 'Error',
          description: error.error || 'Failed to issue refund',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error issuing refund:', error)
      addToast({
        title: 'Error',
        description: 'Failed to issue refund',
        variant: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleIssueCredit = async () => {
    if (!creditData.userId || !creditData.amount) {
      addToast({
        title: 'Error',
        description: 'User ID and amount are required',
        variant: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const res = await fetch('/api/admin/support/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditData)
      })

      if (res.ok) {
        addToast({
          title: 'Success',
          description: 'Credit applied successfully',
          variant: 'success'
        })
        setCreditData({ userId: '', amount: 0, reason: '' })
      } else {
        const error = await res.json()
        addToast({
          title: 'Error',
          description: error.error || 'Failed to issue credit',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error issuing credit:', error)
      addToast({
        title: 'Error',
        description: 'Failed to issue credit',
        variant: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleResetPassword = async () => {
    if (!passwordResetEmail) {
      addToast({
        title: 'Error',
        description: 'Email is required',
        variant: 'error'
      })
      return
    }

    try {
      setProcessing(true)
      const res = await fetch('/api/admin/support/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordResetEmail })
      })

      if (res.ok) {
        const data = await res.json()
        addToast({
          title: 'Success',
          description: 'Password reset link generated. Link copied to clipboard.',
          variant: 'success'
        })
        // Copy link to clipboard
        if (data.resetLink) {
          navigator.clipboard.writeText(data.resetLink)
        }
        setPasswordResetEmail('')
      } else {
        const error = await res.json()
        addToast({
          title: 'Error',
          description: error.error || 'Failed to generate reset link',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      addToast({
        title: 'Error',
        description: 'Failed to generate password reset link',
        variant: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DashboardLayout
      title="Support Tools"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Support Tools' }]}
    >
      {/* User Lookup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Lookup</CardTitle>
          <CardDescription>Search for users by email or name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search by email or name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
            />
            <Button onClick={handleUserSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setSelectedUser(user)
                    router.push(`/admin/users/${user.id}`)
                  }}
                >
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.full_name || 'No name'}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Issue Refund */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Issue Refund</span>
            </CardTitle>
            <CardDescription>Refund a payment to a user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={refundData.userId}
                onChange={(e) => setRefundData({ ...refundData, userId: e.target.value })}
                placeholder="User UUID"
              />
            </div>
            <div>
              <Label>Amount (£)</Label>
              <Input
                type="number"
                value={refundData.amount}
                onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="10.00"
              />
            </div>
            <div>
              <Label>Payment ID (Optional)</Label>
              <Input
                value={refundData.paymentId}
                onChange={(e) => setRefundData({ ...refundData, paymentId: e.target.value })}
                placeholder="Stripe payment ID"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={refundData.reason}
                onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                placeholder="Reason for refund..."
              />
            </div>
            <Button onClick={handleIssueRefund} disabled={processing} className="w-full">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Issue Refund
            </Button>
          </CardContent>
        </Card>

        {/* Issue Credit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Issue Credit</span>
            </CardTitle>
            <CardDescription>Add credit to a user's account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input
                value={creditData.userId}
                onChange={(e) => setCreditData({ ...creditData, userId: e.target.value })}
                placeholder="User UUID"
              />
            </div>
            <div>
              <Label>Amount (£)</Label>
              <Input
                type="number"
                value={creditData.amount}
                onChange={(e) => setCreditData({ ...creditData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="10.00"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={creditData.reason}
                onChange={(e) => setCreditData({ ...creditData, reason: e.target.value })}
                placeholder="Reason for credit..."
              />
            </div>
            <Button onClick={handleIssueCredit} disabled={processing} className="w-full">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Apply Credit
            </Button>
          </CardContent>
        </Card>

        {/* Send Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Send Email</span>
            </CardTitle>
            <CardDescription>Send an email to a user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Email message..."
                rows={5}
              />
            </div>
            <Button disabled={processing} className="w-full">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Email
            </Button>
          </CardContent>
        </Card>

        {/* Reset Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Reset Password</span>
            </CardTitle>
            <CardDescription>Generate a password reset link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>User Email</Label>
              <Input
                value={passwordResetEmail}
                onChange={(e) => setPasswordResetEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <Button onClick={handleResetPassword} disabled={processing} className="w-full">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
              Generate Reset Link
            </Button>
            <p className="text-xs text-muted-foreground">
              The reset link will be copied to your clipboard
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

