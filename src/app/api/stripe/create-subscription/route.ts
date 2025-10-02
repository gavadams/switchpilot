import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/config'
import { createClient } from '../../../../lib/supabase/server'

interface CreateSubscriptionRequest {
  payment_method_id: string
  amount: number
  dd_id: string
}

interface CreateSubscriptionResponse {
  subscription_id: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSubscriptionRequest = await request.json()
    const { payment_method_id, amount, dd_id } = body

    if (!payment_method_id || !amount || !dd_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: profile.stripe_customer_id,
    })

    // Set as default payment method
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    })

    // Create a product first
    const product = await stripe.products.create({
      name: 'SwitchPilot Direct Debit',
      description: 'Monthly direct debit for bank switching requirements',
    })

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: Math.round(amount * 100), // Convert to pence
      recurring: {
        interval: 'month',
      },
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: profile.stripe_customer_id,
      items: [
        {
          price: price.id,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    })

    // Update direct debit record with Stripe data
    const { error: updateError } = await supabase
      .from('direct_debits')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: profile.stripe_customer_id,
        status: 'active',
        stripe_payment_method_id: payment_method_id,
      })
      .eq('id', dd_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating direct debit with Stripe data:', updateError)
      return NextResponse.json({ error: 'Failed to update direct debit' }, { status: 500 })
    }

    const response: CreateSubscriptionResponse = {
      subscription_id: subscription.id,
      status: subscription.status,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
