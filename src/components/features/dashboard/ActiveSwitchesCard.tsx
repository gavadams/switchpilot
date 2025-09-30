'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getActiveSwitches, getActiveSwitchesCount, ActiveSwitch } from '../../../lib/supabase/analytics'
import { ArrowRightLeft, Clock, ArrowRight, Plus, Loader2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import Link from 'next/link'

interface ActiveSwitchesCardProps {
  className?: string
}

export default function ActiveSwitchesCard({ className }: ActiveSwitchesCardProps) {
  const { user } = useAuth()
  const [activeSwitches, setActiveSwitches] = useState<ActiveSwitch[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchActiveSwitches = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [switches, count] = await Promise.all([
          getActiveSwitches(user.id, 3),
          getActiveSwitchesCount(user.id)
        ])
        
        setActiveSwitches(switches)
        setActiveCount(count)
      } catch (err) {
        console.error('Error fetching active switches:', err)
        setError('Failed to load active switches')
      } finally {
        setLoading(false)
      }
    }

    fetchActiveSwitches()
  }, [user?.id])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }


  const getDaysRemainingColor = (days: number): string => {
    if (days <= 7) return 'text-red-600'
    if (days <= 14) return 'text-accent-600'
    return 'text-neutral-600'
  }

  if (loading) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            Active Switches
          </CardTitle>
          <CardDescription>Your current bank switching progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading switches...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`card-professional border-0 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            Active Switches
          </CardTitle>
          <CardDescription>Your current bank switching progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            Active Switches
          </div>
          <Badge className="bg-primary-500 text-white border-0">
            {activeCount}
          </Badge>
        </CardTitle>
        <CardDescription>Your current bank switching progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSwitches.length === 0 ? (
          // Empty State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Active Switches</h3>
            <p className="text-neutral-600 mb-4">Start your first bank switch to begin earning rewards!</p>
            <Link href="/deals">
              <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start New Switch
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Active Switches List */}
            <div className="space-y-4">
              {activeSwitches.map((switch_) => (
                <div key={switch_.id} className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-800 mb-1">
                        {switch_.bankName}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        Reward: {formatCurrency(switch_.rewardAmount)}
                      </p>
                    </div>
                    <Badge className="bg-primary-500 text-white border-0">
                      {switch_.progress}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress 
                      value={switch_.progress} 
                      className="h-2"
                    />
                  </div>

                  {/* Status Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span className={getDaysRemainingColor(switch_.daysRemaining)}>
                        {switch_.daysRemaining} days left
                      </span>
                    </div>
                    <span className="text-neutral-600">
                      {switch_.nextAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <Link href="/switches" className="block">
                <Button 
                  variant="outline" 
                  className="w-full group hover:bg-primary-50 hover:border-primary-200"
                >
                  <span>View All Switches</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/deals" className="block">
                <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Switch
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

