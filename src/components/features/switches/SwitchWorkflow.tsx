'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Database } from '../../../types/supabase'
import { updateSwitchStep, calculateSwitchProgress, calculateEstimatedCompletion } from '../../../lib/supabase/switches'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar,
  FileText,
  Save,
  Loader2,
  CreditCard
} from 'lucide-react'
import DDSetupWizard from '../billing/DDSetupWizard'

type SwitchStep = Database['public']['Tables']['switch_steps']['Row']
type UserSwitch = Database['public']['Tables']['user_switches']['Row'] & {
  bank_deals: {
    bank_name: string
    reward_amount: number
    expiry_date: string | null
    time_to_payout: string | null
    required_direct_debits: number
  } | null
}

interface SwitchWorkflowProps {
  userSwitch: UserSwitch
  steps: SwitchStep[]
  onStepUpdate?: () => void
}

export default function SwitchWorkflow({ userSwitch, steps, onStepUpdate }: SwitchWorkflowProps) {
  const [updatingSteps, setUpdatingSteps] = useState<Set<string>>(new Set())
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set())
  const [autoSaveTimeouts, setAutoSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({})
  const [autoSaving, setAutoSaving] = useState<Set<string>>(new Set())
  const [ddWizardOpen, setDdWizardOpen] = useState(false)

  // Initialize step notes from existing step data
  useEffect(() => {
    const initialNotes: Record<string, string> = {}
    steps.forEach(step => {
      if (step.notes) {
        initialNotes[step.id] = step.notes
      }
    })
    setStepNotes(initialNotes)
  }, [steps])

  // Auto-save notes with debouncing
  const handleNotesChange = (stepId: string, value: string) => {
    setStepNotes(prev => ({
      ...prev,
      [stepId]: value
    }))

    // Clear existing timeout for this step
    if (autoSaveTimeouts[stepId]) {
      clearTimeout(autoSaveTimeouts[stepId])
    }

    // Set new timeout for auto-save (2 seconds after user stops typing)
    const timeout = setTimeout(() => {
      autoSaveNotes(stepId, value)
    }, 2000)

    setAutoSaveTimeouts(prev => ({
      ...prev,
      [stepId]: timeout
    }))
  }

  // Auto-save notes function
  const autoSaveNotes = async (stepId: string, value: string) => {
    setAutoSaving(prev => new Set(prev).add(stepId))
    
    try {
      await updateSwitchStep(stepId, { notes: value })
      // Optional: Show a subtle indicator that notes were saved
    } catch (error) {
      // Silent fail for auto-save - user can manually save if needed
    } finally {
      setAutoSaving(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [autoSaveTimeouts])

  // Save pending changes before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any pending auto-saves
      const hasPendingSaves = Object.keys(autoSaveTimeouts).length > 0
      
      if (hasPendingSaves) {
        // Force save all pending changes immediately
        Object.entries(autoSaveTimeouts).forEach(([stepId, timeout]) => {
          if (timeout) {
            clearTimeout(timeout)
            // Get the current notes value and save immediately
            const currentNotes = stepNotes[stepId] || ''
            if (currentNotes !== (steps.find(s => s.id === stepId)?.notes || '')) {
              updateSwitchStep(stepId, { notes: currentNotes }).catch(() => {
                // Silent fail - page is unloading anyway
              })
            }
          }
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [autoSaveTimeouts, stepNotes, steps])

  const progress = calculateSwitchProgress(steps)
  const estimatedCompletion = calculateEstimatedCompletion(userSwitch.started_at, steps)

  const handleStepToggle = async (stepId: string, completed: boolean) => {
    setUpdatingSteps(prev => new Set(prev).add(stepId))
    
    try {
      await updateSwitchStep(stepId, { completed })
      onStepUpdate?.()
    } catch (error) {
      // Silent fail for auto-save - user can manually retry if needed
    } finally {
      setUpdatingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const handleDDSetupSuccess = () => {
    // Find the "Set Up Direct Debits" step and mark it as completed
    const ddStep = steps.find(step => step.step_name === 'Set Up Direct Debits')
    if (ddStep) {
      handleStepToggle(ddStep.id, true)
    }
    setDdWizardOpen(false)
  }

  const handleSaveNotes = async (stepId: string) => {
    setSavingNotes(prev => new Set(prev).add(stepId))
    
    try {
      const notesValue = stepNotes[stepId] || ''
      await updateSwitchStep(stepId, { notes: notesValue })
      onStepUpdate?.()
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setSavingNotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const getStepStatus = (step: SwitchStep) => {
    if (step.completed) return 'completed'
    if (step.due_date && new Date(step.due_date) < new Date()) return 'overdue'
    return 'pending'
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'overdue':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            Switch Progress
          </CardTitle>
          <CardDescription>
            Track your bank switching journey step by step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">Overall Progress</span>
              <span className="text-sm font-bold text-primary-600">
                {progress.completedSteps}/{progress.totalSteps} steps completed
              </span>
            </div>
            <Progress value={progress.progressPercentage} className="h-3" />
            <div className="text-center mt-2">
              <span className="text-lg font-bold text-primary-600">
                {progress.progressPercentage}% complete
              </span>
            </div>
          </div>

          {/* Direct Debit Requirements */}
          {userSwitch.bank_deals?.required_direct_debits && userSwitch.bank_deals.required_direct_debits > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-accent-600" />
                <span className="font-semibold text-accent-800">Direct Debit Requirements</span>
              </div>
              <p className="text-sm text-accent-700">
                This switch requires <strong>{userSwitch.bank_deals.required_direct_debits} direct debit{userSwitch.bank_deals.required_direct_debits > 1 ? 's' : ''}</strong> to be set up.
                {userSwitch.bank_deals.required_direct_debits > 1 && (
                  <span className="block mt-1 text-xs text-accent-600">
                    You can set up multiple DDs using the "Setup Direct Debits" button below.
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Started</span>
              </div>
              <span className="text-sm font-bold text-neutral-800">
                {format(new Date(userSwitch.started_at), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Est. Completion</span>
              </div>
              <span className="text-sm font-bold text-primary-800">
                {format(estimatedCompletion, 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Workflow */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary-600" />
            Switch Steps
          </CardTitle>
          <CardDescription>
            Complete each step to progress through your bank switch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step)
              const isUpdating = updatingSteps.has(step.id)
              const isSavingNotes = savingNotes.has(step.id)
              
              return (
                <div key={step.id} className="relative">
                  {/* Timeline Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-neutral-200"></div>
                  )}
                  
                  <div className="flex gap-4 p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200">
                    {/* Step Number & Status */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                        step.completed 
                          ? 'bg-success-500 border-success-500 text-white' 
                          : 'bg-white border-neutral-300 text-neutral-600'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="text-sm font-bold">{step.step_number}</span>
                        )}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                            {step.step_name}
                          </h3>
                          <p className="text-sm text-neutral-600 mb-2">
                            {step.description}
                          </p>
                          
                          {/* Step Status Badge */}
                          <Badge variant={getStepStatusColor(status)} className="mb-3">
                            {status === 'completed' && 'Completed'}
                            {status === 'overdue' && 'Overdue'}
                            {status === 'pending' && 'Pending'}
                          </Badge>
                        </div>

                        {/* Complete Button */}
                        <div className="flex-shrink-0 ml-4">
                          {!step.completed ? (
                            step.step_name === 'Set Up Direct Debits' ? (
                              <Button
                                onClick={() => setDdWizardOpen(true)}
                                size="sm"
                                className="bg-primary-500 hover:bg-primary-600 text-white"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Setup Direct Debits
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleStepToggle(step.id, true)}
                                disabled={isUpdating}
                                size="sm"
                                className="bg-success-500 hover:bg-success-600 text-white"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Complete
                                  </>
                                )}
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={() => handleStepToggle(step.id, false)}
                              disabled={isUpdating}
                              size="sm"
                              variant="outline"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Circle className="w-4 h-4 mr-2" />
                                  Undo
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step Dates */}
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        {step.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {format(new Date(step.due_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        {step.completed_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Completed: {format(new Date(step.completed_at), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-neutral-700">
                            Notes (optional)
                          </label>
                          {autoSaving.has(step.id) && (
                            <div className="flex items-center gap-1 text-xs text-primary-600">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Auto-saving...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add notes about this step... (auto-saves after 2 seconds)"
                            value={stepNotes[step.id] || step.notes || ''}
                            onChange={(e) => handleNotesChange(step.id, e.target.value)}
                            className="flex-1 min-h-[80px]"
                          />
                          <Button
                            onClick={() => handleSaveNotes(step.id)}
                            disabled={isSavingNotes}
                            size="sm"
                            variant="outline"
                            className="self-start"
                          >
                            {isSavingNotes ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Direct Debit Setup Wizard */}
      <DDSetupWizard 
        open={ddWizardOpen}
        onOpenChange={setDdWizardOpen}
        onSuccess={handleDDSetupSuccess}
        switchId={userSwitch.id}
        requiredDDCount={userSwitch.bank_deals?.required_direct_debits}
      />
    </div>
  )
}
