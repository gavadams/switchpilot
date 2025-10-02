import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/config'
import { createClient } from '../../../../lib/supabase/server'

interface CancelSubscriptionRequest {
  subscription_id: string
  dd_id: string
}

interface CancelSubscriptionResponse {
  success: boolean
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

    const body: CancelSubscriptionRequest = await request.json()
    const { subscription_id, dd_id } = body

    if (!subscription_id || !dd_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the direct debit belongs to the user
    const { data: directDebit, error: ddError } = await supabase
      .from('direct_debits')
      .select('id, stripe_subscription_id')
      .eq('id', dd_id)
      .eq('user_id', user.id)
      .single()

    if (ddError || !directDebit) {
      return NextResponse.json({ error: 'Direct debit not found' }, { status: 404 })
    }

    if (directDebit.stripe_subscription_id !== subscription_id) {
      return NextResponse.json({ error: 'Subscription ID mismatch' }, { status: 400 })
    }

    // Cancel the Stripe subscription
    let subscription
    try {
      subscription = await stripe.subscriptions.cancel(subscription_id)
    } catch (stripeError: unknown) {
      if ((stripeError as { code?: string }).code === 'resource_missing') {
        // Subscription already cancelled or doesn't exist
        console.log('Subscription already cancelled or not found')
      } else {
        throw stripeError
      }
    }

    // Update direct debit status
    const { error: updateError } = await supabase
      .from('direct_debits')
      .update({
        status: 'cancelled',
      })
      .eq('id', dd_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating direct debit status:', updateError)
      return NextResponse.json({ error: 'Failed to update direct debit status' }, { status: 500 })
    }

    const response: CancelSubscriptionResponse = {
      success: true,
      status: subscription?.status || 'cancelled',
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
