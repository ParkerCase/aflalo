import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

// TODO: Add your Stripe secret key to .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function GET(request: NextRequest) {
  try {
    // Get current user and company
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 400 })
    }

    if (profile.role !== 'company_owner' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get Stripe customer ID
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('company_id', profile.company_id)
      .single()

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({ subscription: null })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price.product'],
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null })
    }

    const subscription = subscriptions.data[0] as any
    const price = subscription.items.data[0].price
    const product = price.product as Stripe.Product

    // Map Stripe plan names to display names
    const planNameMap: Record<string, string> = {
      'starter': 'Starter',
      'professional': 'Professional', 
      'pro': 'Professional',
      'enterprise': 'Enterprise',
    }

    const planName = planNameMap[product.name.toLowerCase()] || product.name

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: planName,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        renewsAt: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripePriceId: price.id,
        stripeProductId: product.id,
      }
    })
  } catch (error) {
    console.error('Stripe subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
} 