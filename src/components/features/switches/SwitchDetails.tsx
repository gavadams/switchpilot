'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Database } from '../../../types/supabase'
import { updateSwitchStatus, updateSwitchNotes, calculateSwitchProgress, calculateEstimatedCompletion } from '../../../lib/supabase/switches'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowLeft,
  Banknote, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Save,
  Loader2,
  XCircle
} from 'lucide-react'
import SwitchWorkflow from './SwitchWorkflow'

type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
  } | null
}

type SwitchStep = Database['public']['Tables']['switch_steps']['Row']

interface SwitchDetailsProps {
  userSwitch: UserSwitch
  steps: SwitchStep[]
  onSwitchUpdate?: () => void
}

export default function SwitchDetails({ userSwitch, steps, onSwitchUpdate }: SwitchDetailsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [switchNotes, setSwitchNotes] = useState(userSwitch.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const router = useRouter()

  const progress = calculateSwitchProgress(steps)
  const estimatedCompletion = calculateEstimatedCompletion(userSwitch.started_at, steps)

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

  const handleStatusUpdate = async (status: 'completed' | 'failed') => {
    setIsUpdating(true)
    try {
      await updateSwitchStatus(userSwitch.id, status)
      onSwitchUpdate?.()
      setShowCompleteDialog(false)
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Error updating switch status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateSwitchNotes(userSwitch.id, switchNotes)
      onSwitchUpdate?.()
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/switches')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Switches
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            {userSwitch.bank_deals?.bank_name || 'Unknown Bank'} Switch
          </h1>
          <p className="text-neutral-600">
            Track your bank switching progress and requirements
          </p>
        </div>
      </div>

      {/* Switch Overview */}
      <Card className="card-professional border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary-600" />
                Switch Overview
              </CardTitle>
              <CardDescription>
                Key details and progress for this bank switch
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(userSwitch.status)} className="text-sm">
              {formatStatus(userSwitch.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reward Amount */}
            <div className="text-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Reward Amount</span>
              </div>
              <div className="text-3xl font-black text-primary-600">
                £{userSwitch.bank_deals?.reward_amount || 0}
              </div>
            </div>

            {/* Progress */}
            <div className="text-center p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl border border-secondary-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-secondary-600" />
                <span className="text-sm font-medium text-secondary-700">Progress</span>
              </div>
              <div className="text-3xl font-black text-secondary-600">
                {progress.progressPercentage}%
              </div>
              <div className="text-sm text-secondary-700">
                {progress.completedSteps}/{progress.totalSteps} steps
              </div>
            </div>

            {/* Timeline */}
            <div className="text-center p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl border border-accent-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-accent-600" />
                <span className="text-sm font-medium text-accent-700">Est. Completion</span>
              </div>
              <div className="text-lg font-bold text-accent-600">
                {format(estimatedCompletion, 'MMM dd')}
              </div>
              <div className="text-sm text-accent-700">
                {formatDistanceToNow(estimatedCompletion, { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Key Dates */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Started</span>
              </div>
              <span className="text-sm font-bold text-neutral-800">
                {format(new Date(userSwitch.started_at), 'MMM dd, yyyy')}
              </span>
            </div>
            
            {userSwitch.completed_at && (
              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-medium text-success-700">Completed</span>
                </div>
                <span className="text-sm font-bold text-success-800">
                  {format(new Date(userSwitch.completed_at), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Switch Workflow */}
      <SwitchWorkflow 
        userSwitch={userSwitch} 
        steps={steps} 
        onStepUpdate={onSwitchUpdate}
      />

      {/* Switch Notes */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-600" />
            Switch Notes
          </CardTitle>
          <CardDescription>
            Add notes and observations about your bank switching experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add notes about your bank switching experience..."
            value={switchNotes}
            onChange={(e) => setSwitchNotes(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {savingNotes ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {userSwitch.status !== 'completed' && userSwitch.status !== 'failed' && (
        <Card className="card-professional border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="outline"
                className="text-error-600 border-error-200 hover:bg-error-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Switch
              </Button>
              <Button
                onClick={() => setShowCompleteDialog(true)}
                className="bg-success-500 hover:bg-success-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-white border-neutral-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error-600" />
              Cancel Switch
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this bank switch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isUpdating}
              className="bg-white border-neutral-200"
            >
              Keep Switch
            </Button>
            <Button
              onClick={() => handleStatusUpdate('failed')}
              disabled={isUpdating}
              className="bg-error-500 hover:bg-error-600 text-white"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-white border-neutral-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-600" />
              Mark Switch Complete
            </DialogTitle>
            <DialogDescription>
              Have you received your reward and completed all requirements? This will mark the switch as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isUpdating}
              className="bg-white border-neutral-200"
            >
              Not Yet
            </Button>
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className="bg-success-500 hover:bg-success-600 text-white"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
