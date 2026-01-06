import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/ssrClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  monthlyPrice: number
  annualPrice: number
  features: string[]
  maxUsers: number
  allowedJurisdictions: string[]
  stripePriceIdMonthly: string
  stripePriceIdAnnual: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Federal opportunities only',
      '1 user',
      'Basic AI analysis',
      'Email support',
      '10 applications per month'
    ],
    maxUsers: 1,
    allowedJurisdictions: ['federal'],
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdAnnual: 'price_starter_annual'
  },
  {
    id: 'professional',
    name: 'Professional',
    tier: 'professional',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      'Federal + State opportunities',
      '5 users',
      'Advanced AI analysis',
      'Priority support',
      'Unlimited applications',
      'Win probability scoring',
      'Competitor research'
    ],
    maxUsers: 5,
    allowedJurisdictions: ['federal', 'state'],
    stripePriceIdMonthly: 'price_professional_monthly',
    stripePriceIdAnnual: 'price_professional_annual'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    monthlyPrice: 999,
    annualPrice: 9990,
    features: [
      'All jurisdictions (Federal, State, Local)',
      '25 users',
      'Premium AI analysis',
      'Dedicated support',
      'Custom integrations',
      'Advanced analytics',
      'Team collaboration tools',
      'API access'
    ],
    maxUsers: 25,
    allowedJurisdictions: ['federal', 'state', 'local'],
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdAnnual: 'price_enterprise_annual'
  }
]

export class PaymentService {
  async createCustomer(
    email: string,
    companyName: string,
    companyId: string
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name: companyName,
        metadata: {
          company_id: companyId
        }
      })

      // Update company with Stripe customer ID
      const supabase = createClient()
      await supabase
        .from('companies')
        .update({ stripe_customer_id: customer.id })
        .eq('id', companyId)

      return customer.id
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    companyId: string,
    tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  ): Promise<{ clientSecret: string; subscriptionId: string }> {
    try {
      const subscriptionResponse = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          company_id: companyId,
          tier
        }
      })
      
      const subscription = subscriptionResponse as Stripe.Subscription

      const invoice = subscription.latest_invoice as Stripe.Invoice & {
        payment_intent?: Stripe.PaymentIntent | string
      }
      let clientSecret: string
      
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
        clientSecret = paymentIntent.client_secret!
      } else {
        throw new Error('No payment intent found on invoice')
      }

      // Create subscription record in database
      const supabase = createClient()
      const subscriptionData = {
        company_id: companyId,
        stripe_subscription_id: subscription.id,
        tier,
        status: subscription.status || 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthly_price: priceId.includes('monthly') ? (invoice.amount_due ? invoice.amount_due / 100 : null) : null,
        annual_price: priceId.includes('annual') ? (invoice.amount_due ? invoice.amount_due / 100 : null) : null,
        billing_cycle: priceId.includes('monthly') ? 'monthly' : 'annual'
      }
      
      await supabase.from('subscriptions').insert(subscriptionData)

      return {
        clientSecret,
        subscriptionId: subscription.id
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      })

      // Update subscription status in database
      const supabase = createClient()
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscriptionId)
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    tier: 'starter' | 'professional' | 'enterprise' | 'custom'
  ): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        metadata: {
          ...subscription.metadata,
          tier
        }
      })

      // Update subscription in database
      const supabase = createClient()
      await supabase
        .from('subscriptions')
        .update({ tier })
        .eq('stripe_subscription_id', subscriptionId)

      // Update company subscription tier and limits
      await supabase
        .from('companies')
        .update({
          subscription_tier: tier,
          max_users: SUBSCRIPTION_PLANS.find(p => p.tier === tier)?.maxUsers || 1,
          allowed_jurisdictions: SUBSCRIPTION_PLANS.find(p => p.tier === tier)?.allowedJurisdictions || ['federal']
        })
        .eq('stripe_customer_id', subscription.customer as string)
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw new Error('Failed to update subscription')
    }
  }

  async createCommissionPayment(
    companyId: string,
    applicationId: string,
    contractValue: number,
    commissionRate: number
  ): Promise<{ paymentIntentId: string; clientSecret: string }> {
    try {
      const commissionAmount = Math.round(contractValue * (commissionRate / 100))
      
      // Get company's Stripe customer
      const supabase = createClient()
      const { data: company } = await supabase
        .from('companies')
        .select('stripe_customer_id, name')
        .eq('id', companyId)
        .single()

      if (!company?.stripe_customer_id) {
        throw new Error('Company not found or no payment method')
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: commissionAmount,
        currency: 'usd',
        customer: company.stripe_customer_id,
        description: `Commission payment for contract win - ${company.name}`,
        metadata: {
          company_id: companyId,
          application_id: applicationId,
          contract_value: contractValue.toString(),
          commission_rate: commissionRate.toString()
        }
      })

      // Create payment record
      await supabase.from('payments').insert({
        company_id: companyId,
        application_id: applicationId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: commissionAmount / 100, // Convert back to dollars
        commission_rate: commissionRate,
        contract_value: contractValue,
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!
      }
    } catch (error) {
      console.error('Error creating commission payment:', error)
      throw new Error('Failed to create commission payment')
    }
  }

  async processWebhook(
    body: string,
    signature: string
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )

      const supabase = createClient()

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription
          await this.handleSubscriptionUpdate(subscription, supabase)
          break

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription
          await this.handleSubscriptionCancellation(deletedSubscription, supabase)
          break

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await this.handlePaymentSuccess(paymentIntent, supabase)
          break

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent
          await this.handlePaymentFailure(failedPayment, supabase)
          break

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice
          await this.handleInvoicePayment(invoice, supabase)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      throw new Error('Webhook processing failed')
    }
  }

  private async handleSubscriptionUpdate(
    subscription: any,
    supabase: any
  ): Promise<void> {
    const companyId = subscription.metadata.company_id
    const tier = subscription.metadata.tier as 'starter' | 'professional' | 'enterprise' | 'custom'

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .upsert({
        company_id: companyId,
        stripe_subscription_id: subscription.id,
        tier,
        status: subscription.status,
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      })

    // Update company subscription status
    await supabase
      .from('companies')
      .update({
        subscription_tier: tier,
        subscription_status: subscription.status,
        max_users: SUBSCRIPTION_PLANS.find(p => p.tier === tier)?.maxUsers || 1,
        allowed_jurisdictions: SUBSCRIPTION_PLANS.find(p => p.tier === tier)?.allowedJurisdictions || ['federal']
      })
      .eq('id', companyId)
  }

  private async handleSubscriptionCancellation(
    subscription: any,
    supabase: any
  ): Promise<void> {
    const companyId = subscription.metadata.company_id

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id)

    // Downgrade company to starter plan
    await supabase
      .from('companies')
      .update({
        subscription_tier: 'starter',
        subscription_status: 'canceled',
        max_users: 1,
        allowed_jurisdictions: ['federal']
      })
      .eq('id', companyId)
  }

  private async handlePaymentSuccess(
    paymentIntent: any,
    supabase: any
  ): Promise<void> {
    if (paymentIntent.metadata.application_id) {
      // This is a commission payment
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          paid_date: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      // Mark commission as paid in application
      await supabase
        .from('applications')
        .update({ commission_paid: true })
        .eq('id', paymentIntent.metadata.application_id)
    }
  }

  private async handlePaymentFailure(
    paymentIntent: any,
    supabase: any
  ): Promise<void> {
    if (paymentIntent.metadata.application_id) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id)
    }
  }

  private async handleInvoicePayment(
    invoice: any,
    supabase: any
  ): Promise<void> {
    // Handle subscription invoice payments
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
      await this.handleSubscriptionUpdate(subscription, supabase)
    }
  }

  async getSubscriptionUsage(companyId: string): Promise<{
    currentUsers: number
    maxUsers: number
    opportunitiesViewed: number
    applicationsSubmitted: number
    aiCreditsUsed: number
  }> {
    const supabase = createClient()

    try {
      // Get current user count
      const { count: currentUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true)

      // Get company limits
      const { data: company } = await supabase
        .from('companies')
        .select('max_users')
        .eq('id', companyId)
        .single()

      // Get usage metrics for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: applicationsSubmitted } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', startOfMonth.toISOString())

      const { count: aiCreditsUsed } = await supabase
        .from('ai_cache')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      return {
        currentUsers: currentUsers || 0,
        maxUsers: company?.max_users || 1,
        opportunitiesViewed: 0, // Would track this in analytics_events
        applicationsSubmitted: applicationsSubmitted || 0,
        aiCreditsUsed: aiCreditsUsed || 0
      }
    } catch (error) {
      console.error('Error getting subscription usage:', error)
      throw new Error('Failed to get usage data')
    }
  }
}

export const paymentService = new PaymentService()
