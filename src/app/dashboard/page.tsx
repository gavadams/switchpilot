'use client'

import { useAuth } from '../../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ArrowRightLeft, Star, BarChart3, Target, User } from 'lucide-react'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()

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
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-primary-600 mb-2">£{profile?.total_earnings || 0}</p>
                <p className="text-sm font-medium text-neutral-600">Total Earnings</p>
              </div>
              <div className="text-center p-6 gradient-neutral rounded-xl border border-white/20 shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full mb-4">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-secondary-600 mb-2">0</p>
                <p className="text-sm font-medium text-neutral-600">Active Switches</p>
              </div>
              <div className="text-center p-6 gradient-neutral rounded-xl border border-white/20 shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-accent-500 to-accent-600 text-white border-0 px-4 py-2 text-sm font-medium">
                  {profile?.subscription_tier || 'free'}
                </Badge>
                <p className="text-sm font-medium text-neutral-600 mt-2">Subscription</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-professional border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest bank switching activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-neutral-500" />
                </div>
                <p className="text-neutral-600 font-medium">Coming soon - Activity feed will appear here</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-professional border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                Available Deals
              </CardTitle>
              <CardDescription>New bank switching offers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-secondary-500" />
                </div>
                <p className="text-neutral-600 font-medium">Coming soon - Available deals will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Info Debug Card */}
        <Card className="card-professional border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              Account Information
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
                  <span className="font-medium text-primary-700">Subscription:</span>
                  <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
                    {profile?.subscription_tier || 'free'}
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
      </div>
  )
}

