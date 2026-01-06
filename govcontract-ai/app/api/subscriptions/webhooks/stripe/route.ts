import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

// TODO: Add your Stripe secret key to .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    const supabase = await createServerClient()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }
}

async function handleSubscriptionUpdate(
  subscription: any,
  supabase: any
): Promise<void> {
  const companyId = subscription.metadata.company_id
  const planId = subscription.metadata.plan_id

  // Map plan IDs to display names
  const planNameMap: Record<string, string> = {
    'price_starter_TODO': 'Starter',
    'price_pro_TODO': 'Professional',
    'price_enterprise_TODO': 'Enterprise',
  }

  const planName = planNameMap[planId] || 'Unknown'

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .upsert({
      company_id: companyId,
      stripe_subscription_id: subscription.id,
      plan: planName,
      status: subscription.status,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    })

  // Update company subscription status
  await supabase
    .from('companies')
    .update({
      subscription_plan: planName,
      subscription_status: subscription.status,
    })
    .eq('id', companyId)
}

async function handleSubscriptionCancellation(
  subscription: any,
  supabase: any
): Promise<void> {
  const companyId = subscription.metadata.company_id

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update company subscription status
  await supabase
    .from('companies')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', companyId)
}

async function handleInvoicePayment(
  invoice: any,
  supabase: any
): Promise<void> {
  // Handle subscription invoice payments
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionUpdate(subscription, supabase)
  }
}

async function handleInvoicePaymentFailed(
  invoice: any,
  supabase: any
): Promise<void> {
  // Handle failed payments
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscription.id)

    await supabase
      .from('companies')
      .update({ subscription_status: 'past_due' })
      .eq('id', subscription.metadata.company_id)
  }
} 