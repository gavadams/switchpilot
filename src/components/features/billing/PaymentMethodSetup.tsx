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
  hidePostalCode: true, // This removes the ZIP code requirement
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
        console.error('Stripe error:', error)
        
        // Handle specific Stripe error types
        let errorMessage = 'Payment setup failed'
        
        if (error.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different card.'
        } else if (error.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.'
        } else if (error.code === 'incorrect_cvc') {
          errorMessage = 'Your card\'s security code is incorrect. Please check and try again.'
        } else if (error.code === 'processing_error') {
          errorMessage = 'An error occurred while processing your card. Please try again.'
        } else if (error.code === 'authentication_required') {
          errorMessage = 'Your card requires additional authentication. Please try again.'
        } else if (error.type === 'validation_error') {
          errorMessage = 'Please check your card details and try again.'
        } else {
          errorMessage = error.message || 'Payment setup failed. Please try again.'
        }
        
        setError(errorMessage)
        onError(errorMessage)
      } else if (setupIntent && setupIntent.payment_method) {
        console.log('Payment method setup successful:', setupIntent.payment_method)
        onSuccess(setupIntent.payment_method as string)
      }
    } catch (err) {
      console.error('Error confirming card setup:', err)
      const errorMessage = 'Payment setup failed. Please check your connection and try again.'
      setError(errorMessage)
      onError(errorMessage)
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

      {/* Test Card Information - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Test Mode</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-medium">Test Cards:</p>
            <ul className="ml-4 space-y-1">
              <li>• <strong>Success:</strong> 4242 4242 4242 4242</li>
              <li>• <strong>Declined:</strong> 4000 0000 0000 0002</li>
              <li>• <strong>Auth Required:</strong> 4000 0025 0000 3155</li>
            </ul>
            <p className="mt-2 text-blue-600">Use any future expiry date and any 3-digit CVC.</p>
          </div>
        </div>
      )}

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
