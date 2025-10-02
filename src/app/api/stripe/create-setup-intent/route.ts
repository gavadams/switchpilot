import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/config'
import { createClient } from '../../../../lib/supabase/server'

interface CreateSetupIntentRequest {
  amount: number
  frequency: 'monthly' | 'one-time'
}

interface CreateSetupIntentResponse {
  client_secret: string
  customer_id: string
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSetupIntentRequest = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get or create Stripe customer
    let customer_id: string
    
    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (profile.stripe_customer_id) {
      customer_id = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      })
      
      customer_id = customer.id
      
      // Store customer ID in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer_id })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error updating profile with Stripe customer ID:', updateError)
        return NextResponse.json({ error: 'Failed to save customer ID' }, { status: 500 })
      }
    }

    // Create SetupIntent for payment method collection
    const setupIntent = await stripe.setupIntents.create({
      customer: customer_id,
      payment_method_types: ['card'],
      usage: 'off_session', // For future payments
    })

    const response: CreateSetupIntentResponse = {
      client_secret: setupIntent.client_secret!,
      customer_id: customer_id,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}
