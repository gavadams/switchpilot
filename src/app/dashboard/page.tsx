'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Loader2 } from 'lucide-react'
import { getActiveSwitchesCount, getUserEarnings } from '../../lib/supabase/analytics'

// Import dashboard components
import EarningsCard from '../../components/features/dashboard/EarningsCard'
import ActiveSwitchesCard from '../../components/features/dashboard/ActiveSwitchesCard'
import AvailableDealsCard from '../../components/features/dashboard/AvailableDealsCard'
import RecentActivityCard from '../../components/features/dashboard/RecentActivityCard'
import QuickActions from '../../components/features/dashboard/QuickActions'
import StatsOverview from '../../components/features/dashboard/StatsOverview'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const [activeSwitchesCount, setActiveSwitchesCount] = useState(0)
  const [loadingActiveCount, setLoadingActiveCount] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loadingEarnings, setLoadingEarnings] = useState(true)

  // Fetch active switches count and total earnings for welcome cards
  useEffect(() => {
    if (!user?.id) return

    const fetchWelcomeData = async () => {
      try {
        setLoadingActiveCount(true)
        setLoadingEarnings(true)
        
        const [count, earnings] = await Promise.all([
          getActiveSwitchesCount(user.id),
          getUserEarnings(user.id)
        ])
        
        setActiveSwitchesCount(count)
        setTotalEarnings(earnings.totalLifetime)
      } catch (error) {
        console.error('Error fetching welcome data:', error)
        setActiveSwitchesCount(0)
        setTotalEarnings(0)
      } finally {
        setLoadingActiveCount(false)
        setLoadingEarnings(false)
      }
    }

    fetchWelcomeData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <Card className="card-professional border-0">
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Welcome back, {profile?.full_name || 'User'}!
          </CardTitle>
          <CardDescription className="text-lg text-neutral-600">
            Here&apos;s an overview of your bank switching activity and earnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 gradient-neutral rounded-xl border border-white/20 shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 px-4 py-2 text-sm font-medium mb-2">
                Free Platform
              </Badge>
              <p className="text-sm font-medium text-neutral-600">Access Level</p>
            </div>
            <div className="text-center p-6 gradient-neutral rounded-xl border border-white/20 shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-full mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-success-600 mb-2">
                {loadingEarnings ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  `£${totalEarnings}`
                )}
              </p>
              <p className="text-sm font-medium text-neutral-600">Total Earnings</p>
            </div>
            <div className="text-center p-6 gradient-neutral rounded-xl border border-white/20 shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-accent-600 mb-2">
                {loadingActiveCount ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  activeSwitchesCount
                )}
              </p>
              <p className="text-sm font-medium text-neutral-600">Active Switches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 1: Earnings and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsCard />
        <StatsOverview />
      </div>

      {/* Row 2: Active Switches and Available Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveSwitchesCard />
        <AvailableDealsCard />
      </div>

      {/* Row 3: Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard />
        <QuickActions />
      </div>

      {/* Debug Card - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="card-professional border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              Account Information (Debug)
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <span className="font-medium text-neutral-700">User ID:</span>
                  <span className="text-sm text-neutral-600 font-mono">{user?.id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <span className="font-medium text-neutral-700">Email:</span>
                  <span className="text-sm text-neutral-600">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
                  <span className="font-medium text-neutral-700">Full Name:</span>
                  <span className="text-sm text-neutral-600">{profile?.full_name || 'Not set'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                  <span className="font-medium text-primary-700">Platform Access:</span>
                  <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
                    Free Platform
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
                  <span className="font-medium text-success-700">Total Earnings:</span>
                  <span className="text-lg font-bold text-success-600">£{profile?.total_earnings || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

