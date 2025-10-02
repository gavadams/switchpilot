'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { Database } from '../../../types/supabase'

type DirectDebit = Database['public']['Tables']['direct_debits']['Row']
import { getProviderById } from '../../../lib/data/dd-providers'
import { cancelDirectDebit, deleteDirectDebit, getPaymentHistory } from '../../../lib/supabase/direct-debits'
import { useAuth } from '../../../context/AuthContext'

interface DirectDebitCardProps {
  directDebit: DirectDebit
  switches?: Array<{
    id: string
    bank_deals?: {
      bank_name: string
    } | null
  }>
  onUpdate: () => void
}

export default function DirectDebitCard({ directDebit, switches = [], onUpdate }: DirectDebitCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: string
    amount: number
    status: string
    payment_date: string
  }>>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const { user } = useAuth()
  const provider = getProviderById(directDebit.provider)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-accent-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-neutral-400" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-error-600" />
      default:
        return <Clock className="w-4 h-4 text-neutral-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700 border-success-200'
      case 'pending':
        return 'bg-accent-100 text-accent-700 border-accent-200'
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200'
      case 'completed':
        return 'bg-primary-100 text-primary-700 border-primary-200'
      case 'failed':
        return 'bg-error-100 text-error-700 border-error-200'
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200'
    }
  }

  const isSwitchPilotDD = directDebit.provider === 'switchpilot'
  const isExternalDD = provider?.isExternal === true
  const isExternalManualDD = directDebit.provider === 'external_manual'

  // Fetch payment history for SwitchPilot DDs
  useEffect(() => {
    if (isSwitchPilotDD && directDebit.id) {
      const fetchHistory = async () => {
        try {
          setLoadingHistory(true)
          const history = await getPaymentHistory(directDebit.id)
          setPaymentHistory(history)
        } catch (error) {
          console.error('Error fetching payment history:', error)
        } finally {
          setLoadingHistory(false)
        }
      }
      fetchHistory()
    }
  }, [isSwitchPilotDD, directDebit.id])
  
  // Find linked switch
  const linkedSwitch = directDebit.switch_id 
    ? switches.find(switch_ => switch_.id === directDebit.switch_id)
    : null

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleCancel = async () => {
    if (!user?.id) return
    
    const confirmed = window.confirm(
      `Are you sure you want to cancel this direct debit? This action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      setIsCancelling(true)
      await cancelDirectDebit(directDebit.id)
      onUpdate()
    } catch (error) {
      console.error('Error cancelling direct debit:', error)
      alert('Failed to cancel direct debit. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDelete = async () => {
    if (!user?.id) return
    
    const confirmed = window.confirm(
      `Are you sure you want to remove this external direct debit from tracking? This action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await deleteDirectDebit(directDebit.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting direct debit:', error)
      alert('Failed to delete direct debit. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const isCancellable = directDebit.status === 'active' || directDebit.status === 'pending'

  return (
    <Card className="card-professional border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-bold text-neutral-800 break-words">
                {provider?.name || directDebit.provider}
              </CardTitle>
              {isSwitchPilotDD && (
                <Badge variant="outline" className="bg-primary-100 text-primary-700 border-primary-200 text-xs">
                  SwitchPilot
                </Badge>
              )}
              {isExternalManualDD && (
                <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200 text-xs">
                  External
                </Badge>
              )}
              {isExternalDD && !isExternalManualDD && (
                <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-200 text-xs">
                  External
                </Badge>
              )}
            </div>
            <CardDescription className="text-neutral-600 break-words">
              {isExternalManualDD 
                ? `External direct debit: ${directDebit.charity_name || 'Unknown provider'}`
                : provider?.description || 'Direct debit provider'
              }
            </CardDescription>
            {linkedSwitch && (
              <div className="mt-2 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-200">
                <span className="font-medium">Linked to:</span> {linkedSwitch.bank_deals?.bank_name || 'Bank Switch'}
              </div>
            )}
          </div>
          <Badge 
            variant="outline"
            className={`ml-2 shrink-0 flex items-center gap-1 ${getStatusColor(directDebit.status)}`}
          >
            {getStatusIcon(directDebit.status)}
            <span className="capitalize whitespace-nowrap">{directDebit.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Amount and Frequency */}
        <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Monthly Amount</span>
          </div>
          <div className="text-3xl font-bold text-primary-600 mb-1">
            {formatCurrency(directDebit.amount)}
          </div>
          <div className="text-sm text-primary-600 capitalize">
            {directDebit.frequency}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 mb-6">
          {/* Setup Date */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Setup Date</span>
            </div>
            <span className="text-sm text-neutral-600">
              {formatDate(directDebit.setup_date)}
            </span>
          </div>

          {/* Next Collection */}
          {directDebit.next_collection_date && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent-50 to-accent-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-600" />
                <span className="text-sm font-medium text-accent-700">Next Collection</span>
              </div>
              <span className="text-sm text-accent-600">
                {formatDate(directDebit.next_collection_date)}
              </span>
            </div>
          )}

          {/* Total Collected */}
          {directDebit.total_collected > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success-50 to-success-100 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-600" />
                <span className="text-sm font-medium text-success-700">Total Collected</span>
              </div>
              <span className="text-sm font-bold text-success-600">
                {formatCurrency(directDebit.total_collected)}
              </span>
            </div>
          )}

          {/* Payment History for SwitchPilot DDs */}
          {isSwitchPilotDD && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Payment History</span>
              </div>
              {loadingHistory ? (
                <div className="text-sm text-neutral-500">Loading payment history...</div>
              ) : paymentHistory.length > 0 ? (
                <div className="space-y-1">
                  {paymentHistory.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${
                          payment.status === 'succeeded' ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {formatCurrency(payment.amount)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            payment.status === 'succeeded' 
                              ? 'bg-success-50 text-success-700 border-success-200' 
                              : 'bg-error-50 text-error-700 border-error-200'
                          }`}
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {paymentHistory.length > 3 && (
                    <div className="text-xs text-neutral-500">
                      +{paymentHistory.length - 3} more payments
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">No payment history yet</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-3">
          {/* Provider Website Link */}
          {provider?.website && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(provider.website, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit {provider.name}
            </Button>
          )}

          {/* Cancel Button */}
          {isCancellable && !isExternalManualDD && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Direct Debit'}
            </Button>
          )}

          {/* Delete Button for External Manual DDs */}
          {isExternalManualDD && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove from Tracking'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
