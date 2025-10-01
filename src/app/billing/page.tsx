'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import DirectDebitsList from '../../components/features/billing/DirectDebitsList'
import DDSetupWizard from '../../components/features/billing/DDSetupWizard'

export default function BillingPage() {
  const [setupWizardOpen, setSetupWizardOpen] = useState(false)

  const handleSetupSuccess = () => {
    // The DirectDebitsList will automatically refresh via its onUpdate callback
    setSetupWizardOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
          Direct Debit Management
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Set up and manage direct debits to meet bank switching requirements
        </p>
      </div>

      {/* Revenue Model Information */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Info className="w-6 h-6 text-primary-600" />
            SwitchPilot Direct Debit Service
          </CardTitle>
          <CardDescription>
            Our direct debit service - instant activation for bank switching requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Instant Activation</h4>
                  <p className="text-sm text-neutral-600">
                    SwitchPilot DDs activate immediately - no 3-5 day wait like external options
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Auto-Cancel After Switch</h4>
                  <p className="text-sm text-neutral-600">
                    DDs automatically cancel when your switch completes and reward is received
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Managed Within Platform</h4>
                  <p className="text-sm text-neutral-600">
                    All SwitchPilot DDs managed in one place - no external accounts needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">External Options Available</h4>
                  <p className="text-sm text-neutral-600">
                    Free external charity DDs available but require 3-5 day setup time
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary-800 mb-2">Pricing & Revenue Model</h4>
                <p className="text-sm text-primary-700 mb-3">
                  SwitchPilot DDs are charged separately from your subscription: £1/month per DD until your switch completes.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subscription (platform access):</span>
                    <span className="font-medium">£4.99/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SwitchPilot DDs (per DD needed):</span>
                    <span className="font-medium">£1/month each</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary-800">
                    <span>Example: 3 DDs needed = £7.99/month total</span>
                    <span>£4.99 + £3.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct Debits Management */}
      <DirectDebitsList onSetupNew={() => setSetupWizardOpen(true)} />

      {/* Setup Wizard */}
      <DDSetupWizard 
        open={setupWizardOpen}
        onOpenChange={setSetupWizardOpen}
        onSuccess={handleSetupSuccess}
      />
    </div>
  )
}
