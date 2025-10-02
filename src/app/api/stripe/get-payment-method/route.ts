import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/config'
import { createClient } from '../../../../lib/supabase/server'
import type Stripe from 'stripe'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 })
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method

    if (!defaultPaymentMethod || typeof defaultPaymentMethod === 'string') {
      return NextResponse.json({ error: 'No payment method found' }, { status: 404 })
    }

    const paymentMethod = defaultPaymentMethod as Stripe.PaymentMethod

    return NextResponse.json({
      payment_method: {
        id: paymentMethod.id,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payment method:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    )
  }
}
