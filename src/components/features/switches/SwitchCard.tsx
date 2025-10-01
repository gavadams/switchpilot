'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Database } from '../../../types/supabase'
import { calculateSwitchProgress, calculateEstimatedCompletion } from '../../../lib/supabase/switches'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react'
import Link from 'next/link'

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
  } | null
}

interface SwitchCardProps {
  userSwitch: UserSwitch
  steps: Database['public']['Tables']['switch_steps']['Row'][]
}

export default function SwitchCard({ userSwitch, steps }: SwitchCardProps) {
  // Ensure userSwitch is properly typed and extract values
  const typedUserSwitch = userSwitch as UserSwitch
  const rewardAmount = (typedUserSwitch.bank_deals?.reward_amount as number) || 0
  const progress = calculateSwitchProgress(steps)
  const estimatedCompletion = calculateEstimatedCompletion(typedUserSwitch.started_at, steps)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'waiting':
        return 'warning'
      case 'completed':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <PlayCircle className="w-4 h-4" />
      case 'in_progress':
        return <ArrowRightLeft className="w-4 h-4" />
      case 'waiting':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <PlayCircle className="w-4 h-4" />
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'started':
        return 'Started'
      case 'in_progress':
        return 'In Progress'
      case 'waiting':
        return 'Waiting'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  return (
    <Card className="card-professional border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-neutral-800 mb-2 break-words">
              {typedUserSwitch.bank_deals?.bank_name || 'Unknown Bank'}
            </CardTitle>
            <CardDescription className="text-neutral-600 break-words">
              Bank switching in progress
            </CardDescription>
          </div>
          <Badge 
            variant={getStatusColor(typedUserSwitch.status)}
            className="ml-2 shrink-0 flex items-center gap-1 whitespace-nowrap"
          >
            {getStatusIcon(typedUserSwitch.status)}
            {formatStatus(typedUserSwitch.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Reward Amount */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Reward Amount</span>
          </div>
          <div className="text-3xl font-black text-primary-600">
            £{rewardAmount}
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">Progress</span>
              <span className="text-sm font-bold text-primary-600">
                {progress.completedSteps}/{progress.totalSteps} steps
              </span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
            <div className="text-center mt-2">
              <span className="text-sm font-bold text-primary-600">
                {progress.progressPercentage}% complete
              </span>
            </div>
          </div>

          {/* Current Step */}
          {progress.currentStep && (
            <div className="p-3 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg border border-secondary-200">
              <div className="flex items-center gap-2 mb-1">
                <PlayCircle className="w-4 h-4 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">Current Step</span>
              </div>
              <p className="text-sm font-bold text-secondary-800">
                {progress.currentStep.step_name}
              </p>
            </div>
          )}

          {/* Timeline Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span className="text-xs text-neutral-600">Started</span>
              </div>
              <span className="text-xs font-medium text-neutral-800">
                {format(new Date(typedUserSwitch.started_at), 'MMM dd')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-600" />
                <span className="text-xs text-neutral-600">Est. Complete</span>
              </div>
              <span className="text-xs font-medium text-neutral-800">
                {format(estimatedCompletion, 'MMM dd')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Link href={`/switches/${typedUserSwitch.id}`}>
            <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
