import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe/config'
import { createClient } from '../../../../lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Find the direct debit by subscription ID
        const { data: directDebit, error: ddError } = await supabase
          .from('direct_debits')
          .select('id, amount')
          .eq('stripe_subscription_id', paymentIntent.metadata.subscription_id)
          .single()

        if (!ddError && directDebit) {
          // Update DD status to active
          await supabase
            .from('direct_debits')
            .update({ status: 'active' })
            .eq('id', directDebit.id)

          // Record payment in history
          await supabase
            .from('dd_payments')
            .insert({
              direct_debit_id: directDebit.id,
              stripe_invoice_id: paymentIntent.id,
              amount: directDebit.amount,
              status: 'succeeded',
            })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment failed:', paymentIntent.id)
        
        // Find the direct debit by subscription ID
        const { data: directDebit, error: ddError } = await supabase
          .from('direct_debits')
          .select('id')
          .eq('stripe_subscription_id', paymentIntent.metadata.subscription_id)
          .single()

        if (!ddError && directDebit) {
          // Update DD status to failed
          await supabase
            .from('direct_debits')
            .update({ status: 'failed' })
            .eq('id', directDebit.id)

          // Record failed payment in history
          await supabase
            .from('dd_payments')
            .insert({
              direct_debit_id: directDebit.id,
              stripe_invoice_id: paymentIntent.id,
              amount: 0,
              status: 'failed',
            })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log('Subscription cancelled:', subscription.id)
        
        // Update DD status to cancelled
        await supabase
          .from('direct_debits')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        console.log('Invoice payment succeeded:', invoice.id)
        
        const subscriptionId = (invoice as any).subscription
        if (!subscriptionId) {
          console.log('No subscription found for invoice')
          break
        }
        
        // Find the direct debit by subscription ID
        const { data: directDebit, error: ddError } = await supabase
          .from('direct_debits')
          .select('id, amount')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!ddError && directDebit) {
          // Record successful payment in history
          await supabase
            .from('dd_payments')
            .insert({
              direct_debit_id: directDebit.id,
              stripe_invoice_id: invoice.id,
              amount: directDebit.amount,
              status: 'succeeded',
            })

          // Update total collected
          const { data: currentDD } = await supabase
            .from('direct_debits')
            .select('total_collected')
            .eq('id', directDebit.id)
            .single()

          if (currentDD) {
            await supabase
              .from('direct_debits')
              .update({
                total_collected: (currentDD.total_collected || 0) + directDebit.amount,
                last_collection_date: new Date().toISOString().split('T')[0],
              })
              .eq('id', directDebit.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        console.log('Invoice payment failed:', invoice.id)
        
        const subscriptionId = (invoice as any).subscription
        if (!subscriptionId) {
          console.log('No subscription found for invoice')
          break
        }
        
        // Find the direct debit by subscription ID
        const { data: directDebit, error: ddError } = await supabase
          .from('direct_debits')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!ddError && directDebit) {
          // Update DD status to failed
          await supabase
            .from('direct_debits')
            .update({ status: 'failed' })
            .eq('id', directDebit.id)

          // Record failed payment in history
          await supabase
            .from('dd_payments')
            .insert({
              direct_debit_id: directDebit.id,
              stripe_invoice_id: invoice.id,
              amount: 0,
              status: 'failed',
            })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
