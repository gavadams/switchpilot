'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Info, 
  ExternalLink, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
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

      {/* Information Card */}
      <Card className="card-professional border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Info className="w-6 h-6 text-primary-600" />
            Why Direct Debits Matter
          </CardTitle>
          <CardDescription>
            Understanding the importance of direct debits for bank switching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Bank Switching Requirements</h4>
                  <p className="text-sm text-neutral-600">
                    Most banks require active direct debits to qualify for switching bonuses
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Easy Setup</h4>
                  <p className="text-sm text-neutral-600">
                    Set up direct debits in minutes with our guided process
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Flexible Management</h4>
                  <p className="text-sm text-neutral-600">
                    Pause, modify, or cancel direct debits anytime from your dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-neutral-800">Charity Options</h4>
                  <p className="text-sm text-neutral-600">
                    Support worthy causes while meeting switching requirements
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary-800 mb-2">Quick Start Guide</h4>
                <p className="text-sm text-primary-700 mb-3">
                  New to direct debits? Start with our recommended providers for the easiest setup.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    One Pound DD - £1/month
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    PayPal - £2/month
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    UNICEF - £10/month
                  </Badge>
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
