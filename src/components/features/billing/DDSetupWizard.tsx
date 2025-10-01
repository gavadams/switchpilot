'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Info,
  CreditCard,
  Heart,
  Building
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { createDirectDebit } from '../../../lib/supabase/direct-debits'
import { DD_PROVIDERS, getProvidersByCategory, DDProvider } from '../../../lib/data/dd-providers'

interface DDSetupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type WizardStep = 'provider' | 'amount' | 'confirmation'

interface SelectedProvider {
  id: string
  name: string
  description: string
  website?: string
  setupTime: string
  minAmount?: number
  recommendedAmount?: number
  amount?: number
  category: 'switchpilot' | 'charity' | 'external_service'
  isExternal?: boolean
}

export default function DDSetupWizard({ open, onOpenChange, onSuccess }: DDSetupWizardProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<WizardStep>('provider')
  const [selectedProvider, setSelectedProvider] = useState<SelectedProvider | null>(null)
  const [amount, setAmount] = useState<number>(1)
  const [frequency, setFrequency] = useState<'monthly' | 'one-time'>('monthly')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchPilotProviders = getProvidersByCategory('switchpilot')
  const charityProviders = getProvidersByCategory('charity')
  const externalProviders = getProvidersByCategory('external_service')

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const calculateAnnualCost = (): number => {
    return frequency === 'monthly' ? amount * 12 : amount
  }

  const handleProviderSelect = (provider: DDProvider) => {
    setSelectedProvider(provider)
    setAmount(provider.amount || provider.recommendedAmount || 1)
    setCurrentStep('amount')
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && selectedProvider && (!selectedProvider.minAmount || numValue >= selectedProvider.minAmount)) {
      setAmount(numValue)
    }
  }

  const handleNext = () => {
    if (currentStep === 'provider' && selectedProvider) {
      setCurrentStep('amount')
    } else if (currentStep === 'amount') {
      setCurrentStep('confirmation')
    }
  }

  const handleBack = () => {
    if (currentStep === 'amount') {
      setCurrentStep('provider')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('amount')
    }
  }

  const handleSubmit = async () => {
    if (!user?.id || !selectedProvider) return

    try {
      setIsSubmitting(true)
      setError(null)

      await createDirectDebit({
        user_id: user.id,
        provider: selectedProvider.id,
        charity_name: selectedProvider.category === 'charity' ? selectedProvider.name : undefined,
        amount: amount,
        frequency: frequency
      })

      onSuccess()
      onOpenChange(false)
      resetWizard()
    } catch (err) {
      console.error('Error creating direct debit:', err)
      setError('Failed to setup direct debit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep('provider')
    setSelectedProvider(null)
    setAmount(1)
    setFrequency('monthly')
    setTermsAccepted(false)
    setError(null)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'provider':
        return selectedProvider !== null
      case 'amount':
        return selectedProvider && (!selectedProvider.minAmount || amount >= selectedProvider.minAmount)
      case 'confirmation':
        return termsAccepted
      default:
        return false
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'provider', label: 'Provider', completed: currentStep !== 'provider' },
      { key: 'amount', label: 'Amount', completed: currentStep === 'confirmation' },
      { key: 'confirmation', label: 'Confirm', completed: false }
    ]

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.completed 
                ? 'bg-success-500 text-white' 
                : currentStep === step.key 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-neutral-200 text-neutral-600'
            }`}>
              {step.completed ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === step.key ? 'text-primary-600' : 'text-neutral-600'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-neutral-200 mx-4" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border shadow-lg backdrop-blur-none" style={{ backgroundColor: 'white', opacity: 1 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary-600" />
            Setup Direct Debit
          </DialogTitle>
          <DialogDescription>
            Set up a direct debit to meet bank switching requirements
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        {/* Step 1: Provider Selection */}
        {currentStep === 'provider' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Choose a Provider</h3>
              <p className="text-neutral-600">Select a direct debit provider to get started</p>
            </div>

            {/* SwitchPilot Providers - PRIMARY OPTION */}
            <div>
              <h4 className="text-md font-semibold text-primary-700 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4" />
                SwitchPilot Direct Debits (Recommended)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {switchPilotProviders.map((provider) => (
                  <Card 
                    key={provider.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProvider?.id === provider.id 
                        ? 'ring-2 ring-primary-500 bg-primary-50' 
                        : 'hover:border-primary-200'
                    }`}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription className="text-sm">{provider.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {provider.setupTime}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {provider.minAmount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Min Amount:</span>
                            <span className="font-medium">{formatCurrency(provider.minAmount)}</span>
                          </div>
                        )}
                        {provider.recommendedAmount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Recommended:</span>
                            <span className="font-medium text-primary-600">{formatCurrency(provider.recommendedAmount)}</span>
                          </div>
                        )}
                        {provider.amount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Fixed Amount:</span>
                            <span className="font-medium text-primary-600">{formatCurrency(provider.amount)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* External Providers - SECONDARY OPTIONS */}
            <div>
              <h4 className="text-md font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                External Options (Free but slower)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...charityProviders, ...externalProviders].map((provider) => (
                  <Card 
                    key={provider.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProvider?.id === provider.id 
                        ? 'ring-2 ring-primary-500 bg-primary-50' 
                        : 'hover:border-primary-200'
                    }`}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription className="text-sm">{provider.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {provider.setupTime}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {provider.minAmount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Min Amount:</span>
                            <span className="font-medium">{formatCurrency(provider.minAmount)}</span>
                          </div>
                        )}
                        {provider.recommendedAmount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Recommended:</span>
                            <span className="font-medium text-primary-600">{formatCurrency(provider.recommendedAmount)}</span>
                          </div>
                        )}
                        {provider.amount && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600">Fixed Amount:</span>
                            <span className="font-medium text-primary-600">{formatCurrency(provider.amount)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Amount Selection */}
        {currentStep === 'amount' && selectedProvider && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Set Amount & Frequency</h3>
              <p className="text-neutral-600">Configure your direct debit details</p>
            </div>

            <Card className="border-primary-200 bg-primary-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary-800">{selectedProvider.name}</h4>
                    <p className="text-sm text-primary-600">{selectedProvider.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min={selectedProvider.minAmount}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="mt-1"
                  />
                  {selectedProvider.minAmount && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Minimum: {formatCurrency(selectedProvider.minAmount)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={(value: 'monthly' | 'one-time') => setFrequency(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg border border-accent-200">
                  <h4 className="font-semibold text-accent-800 mb-2">Cost Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Per {frequency === 'monthly' ? 'month' : 'payment'}:</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                    {frequency === 'monthly' && (
                      <div className="flex justify-between">
                        <span>Annual cost:</span>
                        <span className="font-medium">{formatCurrency(calculateAnnualCost())}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProvider.category === 'charity' && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-success-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success-800">Charity Donation</p>
                        <p className="text-xs text-success-600">
                          Your donation supports {selectedProvider.name}&apos;s important work.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirmation' && selectedProvider && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Confirm Setup</h3>
              <p className="text-neutral-600">Review your direct debit details</p>
            </div>

            <Card className="border-primary-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-neutral-800 mb-4">Direct Debit Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Provider:</span>
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Frequency:</span>
                    <span className="font-medium capitalize">{frequency}</span>
                  </div>
                  {frequency === 'monthly' && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Annual Cost:</span>
                      <span className="font-medium">{formatCurrency(calculateAnnualCost())}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-info-800">Important Notes</p>
                    <ul className="text-xs text-info-700 mt-1 space-y-1">
                      <li>• Direct debit setup typically takes {selectedProvider.setupTime}</li>
                      <li>• You can cancel or modify this direct debit at any time</li>
                      <li>• This helps meet bank switching requirements</li>
                      {selectedProvider.category === 'charity' && (
                        <li>• Your donation supports a worthy cause</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the direct debit setup and understand that I can cancel at any time
                </Label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-error-600 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 'provider'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep === 'confirmation' ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {isSubmitting ? 'Setting up...' : 'Setup Direct Debit'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
