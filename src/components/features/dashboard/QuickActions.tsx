'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database } from '../../../types/supabase'
import {
  Plus,
  Search,
  BarChart3,
  CreditCard,
  ArrowRightLeft,
  Target,
  CheckCircle,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { getAllActiveDeals } from '../../../lib/supabase/deals'

type BankDeal = Database['public']['Tables']['bank_deals']['Row']

import { useAuth } from '../../../context/AuthContext'

interface QuickActionsProps {
  className?: string
}

export default function QuickActions({ className }: QuickActionsProps) {
  const [maxReward, setMaxReward] = useState(0)
  const [loading, setLoading] = useState(true)

  // Helper function to safely extract numeric values
  const getRewardAmount = (deal: BankDeal) => deal.reward_amount as number

  // Fetch highest reward amount from available deals
  useEffect(() => {
    const fetchMaxReward = async () => {
      try {
        setLoading(true)
        const deals = await getAllActiveDeals() as BankDeal[]
        const max = deals.reduce((max, deal) => Math.max(max, getRewardAmount(deal)), 0)
        setMaxReward(max)
      } catch (error) {
        console.error('Error fetching max reward:', error)
        setMaxReward(200) // Fallback to default
      } finally {
        setLoading(false)
      }
    }

    fetchMaxReward()
  }, [])

  const actions = [
    {
      id: 'start-switch',
      title: 'Start New Switch',
      description: 'Begin a new bank switching process',
      icon: <Plus className="w-5 h-5" />,
      href: '/deals',
      variant: 'default' as const,
      className: 'bg-primary-500 hover:bg-primary-600 text-white'
    },
    {
      id: 'browse-deals',
      title: 'Browse Deals',
      description: 'Explore available bank switching offers',
      icon: <Search className="w-5 h-5" />,
      href: '/deals',
      variant: 'outline' as const,
      className: 'hover:bg-secondary-50 hover:border-secondary-200'
    },
    {
      id: 'check-progress',
      title: 'Check Progress',
      description: 'View your active switches and progress',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/switches',
      variant: 'outline' as const,
      className: 'hover:bg-accent-50 hover:border-accent-200'
    },
    {
      id: 'setup-direct-debit',
      title: 'Setup Direct Debit',
      description: 'Configure automatic payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/settings',
      variant: 'outline' as const,
      className: 'hover:bg-success-50 hover:border-success-200'
    }
  ]

  return (
    <Card className={`card-professional border-0 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-white" />
          </div>
          Quick Actions
        </CardTitle>
        <CardDescription>Common tasks and navigation shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.id} href={action.href} className="block">
              <Button
                variant={action.variant}
                className={`w-full h-auto p-4 flex flex-col items-start gap-3 ${action.className}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-sm mb-1">
                      {action.title}
                    </h4>
                    <p className="text-xs opacity-80">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {/* Additional Quick Stats */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <Target className="w-5 h-5 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-primary-700">Best Deals</p>
              <p className="text-xs text-primary-600">
                {loading ? 'Loading...' : `Up to £${maxReward}`}
              </p>
            </div>
            <div className="text-center p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg border border-success-200">
              <CheckCircle className="w-5 h-5 text-success-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-success-700">Easy Process</p>
              <p className="text-xs text-success-600">Guided workflow</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

