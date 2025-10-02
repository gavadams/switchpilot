'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '../../ui/alert'
import { 
  CreditCard, 
  Edit, 
  AlertTriangle, 
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

interface PaymentMethod {
  id: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

interface PaymentMethodDisplayProps {
  onUpdatePaymentMethod: () => void
}

export default function PaymentMethodDisplay({ onUpdatePaymentMethod }: PaymentMethodDisplayProps) {
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchPaymentMethod = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user's Stripe customer ID
        const response = await fetch('/api/stripe/get-payment-method', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            setPaymentMethod(null)
            return
          }
          throw new Error('Failed to fetch payment method')
        }

        const data = await response.json()
        setPaymentMethod(data.payment_method)
      } catch (err) {
        console.error('Error fetching payment method:', err)
        setError('Failed to load payment method')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethod()
  }, [user?.id])

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      default:
        return '💳'
    }
  }

  const getCardBrandName = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa'
      case 'mastercard':
        return 'Mastercard'
      case 'amex':
        return 'American Express'
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1)
    }
  }

  const isExpiringSoon = (expMonth: number, expYear: number) => {
    const now = new Date()
    const expDate = new Date(expYear, expMonth - 1)
    const monthsUntilExpiry = (expDate.getFullYear() - now.getFullYear()) * 12 + (expDate.getMonth() - now.getMonth())
    return monthsUntilExpiry <= 3
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <span className="ml-2 text-neutral-600">Loading payment method...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!paymentMethod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-neutral-600" />
            No Payment Method
          </CardTitle>
          <CardDescription>
            You haven&apos;t set up a payment method yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpdatePaymentMethod} className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { card } = paymentMethod
  const expiringSoon = isExpiringSoon(card.exp_month, card.exp_year)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-600" />
          Payment Method
        </CardTitle>
        <CardDescription>
          Your saved payment method for SwitchPilot Direct Debits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCardBrandIcon(card.brand)}</span>
            <div>
              <div className="font-medium text-neutral-800">
                {getCardBrandName(card.brand)} •••• {card.last4}
              </div>
              <div className="text-sm text-neutral-600">
                Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expiringSoon ? (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Expires Soon
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-success-50 text-success-700 border-success-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>

        {expiringSoon && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your card expires in {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}. 
              Please update your payment method to avoid service interruption.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={onUpdatePaymentMethod} 
          variant="outline" 
          className="w-full"
        >
          <Edit className="w-4 h-4 mr-2" />
          Update Payment Method
        </Button>
      </CardContent>
    </Card>
  )
}
