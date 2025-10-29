'use client'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getAffiliateStats } from '../../lib/supabase/affiliates-client'
import { User, Shield, Bell, Info, Lock, Key } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [affiliateEarnings, setAffiliateEarnings] = useState(0)
  const [loadingAffiliate, setLoadingAffiliate] = useState(true)

  // Fetch affiliate earnings
  useEffect(() => {
    const fetchAffiliateEarnings = async () => {
      if (!user?.id) return
      
      try {
        setLoadingAffiliate(true)
        const affiliateStats = await getAffiliateStats(user.id)
        setAffiliateEarnings(affiliateStats.totalRevenue)
      } catch (error) {
        console.error('Error fetching affiliate earnings:', error)
        setAffiliateEarnings(0)
      } finally {
        setLoadingAffiliate(false)
      }
    }

    fetchAffiliateEarnings()
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your personal information and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                defaultValue={profile?.full_name || ''}
                className="input-professional"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                defaultValue={user?.email || ''}
                className="input-professional"
                disabled
              />
              <p className="text-xs text-neutral-500">Email cannot be changed</p>
            </div>
          </div>
          <Button className="bg-primary-500 hover:bg-primary-600">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security and privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
              <div>
                <h4 className="font-semibold text-neutral-800">Change Password</h4>
                <p className="text-sm text-neutral-600">Update your account password</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
              <div>
                <h4 className="font-semibold text-neutral-800">Two-Factor Authentication</h4>
                <p className="text-sm text-neutral-600">Add an extra layer of security</p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            Notification Settings
          </CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
              <div>
                <h4 className="font-semibold text-neutral-800">Email Notifications</h4>
                <p className="text-sm text-neutral-600">Receive updates via email</p>
              </div>
              <Badge className="bg-gradient-to-r from-success-500 to-success-600 text-white border-0">
                Enabled
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
              <div>
                <h4 className="font-semibold text-neutral-800">Deal Alerts</h4>
                <p className="text-sm text-neutral-600">Get notified about new bank deals</p>
              </div>
              <Badge className="bg-gradient-to-r from-success-500 to-success-600 text-white border-0">
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-neutral-500 to-neutral-600 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            Account Information
          </CardTitle>
          <CardDescription>View your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                <span className="font-medium text-neutral-700">User ID:</span>
                <span className="text-sm text-neutral-600 font-mono">{user?.id?.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                <span className="font-medium text-neutral-700">Member Since:</span>
                <span className="text-sm text-neutral-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
                <span className="font-medium text-success-700">Total Earnings (Bank + Affiliate):</span>
                <span className="text-lg font-bold text-success-600">
                  £{loadingAffiliate ? '...' : ((profile?.total_earnings || 0) + affiliateEarnings).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

