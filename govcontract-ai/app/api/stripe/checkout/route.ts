import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

// TODO: Add your Stripe secret key to .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

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

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', profile.company_id)
      .single()

    // TODO: Replace with your actual Stripe price IDs
    const priceMap: Record<string, string> = {
      'price_starter_TODO': process.env.STRIPE_STARTER_PRICE_ID!,
      'price_pro_TODO': process.env.STRIPE_PRO_PRICE_ID!,
      'price_enterprise_TODO': process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    }

    const stripePriceId = priceMap[planId]
    if (!stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Check if company already has a Stripe customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('company_id', profile.company_id)
      .single()

    let customerId = existingCustomer?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company?.email || user.email,
        name: company?.name,
        metadata: {
          company_id: profile.company_id,
          user_id: user.id,
        },
      })

      customerId = customer.id

      // Store customer ID in database
      await supabase
        .from('stripe_customers')
        .insert({
          company_id: profile.company_id,
          stripe_customer_id: customerId,
          email: customer.email,
        })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/company/subscription?canceled=true`,
      metadata: {
        company_id: profile.company_id,
        plan_id: planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 