'use client'

import { useState, useEffect } from 'react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '../../ui/alert'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { getStripe } from '../../../lib/stripe/client'

interface PaymentMethodSetupProps {
  amount: number
  frequency: 'monthly' | 'one-time'
  onSuccess: (paymentMethodId: string) => void
  onError: (error: string) => void
}

const stripePromise = getStripe()

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

function PaymentMethodForm({ amount, frequency, onSuccess, onError }: PaymentMethodSetupProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create setup intent when component mounts
    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            frequency,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create setup intent')
        }

        const data = await response.json()
        setClientSecret(data.client_secret)
      } catch (err) {
        console.error('Error creating setup intent:', err)
        onError('Failed to initialize payment setup')
      }
    }

    createSetupIntent()
  }, [amount, frequency, onSuccess, onError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setIsLoading(false)
      return
    }

    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        setError(error.message || 'Payment setup failed')
        onError(error.message || 'Payment setup failed')
      } else if (setupIntent && setupIntent.payment_method) {
        onSuccess(setupIntent.payment_method as string)
      }
    } catch (err) {
      console.error('Error confirming card setup:', err)
      setError('Payment setup failed')
      onError('Payment setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-neutral-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-neutral-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-neutral-600" />
          <span className="font-medium text-neutral-800">Payment Summary</span>
        </div>
        <div className="space-y-1 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">£{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frequency:</span>
            <span className="font-medium capitalize">{frequency}</span>
          </div>
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="font-medium">SwitchPilot Direct Debit</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isLoading || !clientSecret}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting up payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Setup Payment Method
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentMethodSetup({ amount, frequency, onSuccess, onError }: PaymentMethodSetupProps) {
  return (
    <Elements stripe={stripePromise}>
      <Card className="border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            Payment Method Setup
          </CardTitle>
          <CardDescription>
            Add a payment method for your SwitchPilot Direct Debit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodForm
            amount={amount}
            frequency={frequency}
            onSuccess={onSuccess}
            onError={onError}
          />
        </CardContent>
      </Card>
    </Elements>
  )
}
