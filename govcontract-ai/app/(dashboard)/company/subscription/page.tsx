"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

// TODO: Replace with your real plans from Stripe or your backend
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    features: ["Up to 3 users", "Basic analytics", "Email support"],
    stripePriceId: "price_starter_TODO"
  },
  {
    id: "pro",
    name: "Professional",
    price: "$99/mo",
    features: ["Up to 20 users", "Advanced analytics", "Priority support"],
    stripePriceId: "price_pro_TODO"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    features: ["Unlimited users", "Custom analytics", "Dedicated support"],
    stripePriceId: "price_enterprise_TODO"
  }
]

interface User {
  id: string
  role: string
}

interface Subscription {
  id: string
  plan: string
  status: string
  renewsAt: string
  cancelAtPeriodEnd: boolean
}

export default function SubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [manageLoading, setManageLoading] = useState(false)

  // Check for success/cancel messages from Stripe
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success) {
      // Refresh subscription data after successful checkout
      fetchSubscription()
    }
  }, [searchParams])

  // Load user and subscription data
  useEffect(() => {
    loadUserAndSubscription()
  }, [])

  const loadUserAndSubscription = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        setError('Profile not found')
        return
      }

      setUser({ id: session.user.id, role: profile.role })

      // Fetch subscription data
      await fetchSubscription()
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      // Don't set error here as it's not critical
    }
  }

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManage = async () => {
    setManageLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to open portal')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
      alert(err instanceof Error ? err.message : 'Failed to open portal. Please try again.')
    } finally {
      setManageLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-8 h-8 text-destructive mb-2" />
        <div className="text-lg font-semibold">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-8 h-8 text-destructive mb-2" />
        <div className="text-lg font-semibold">Not authenticated</div>
        <div className="text-muted-foreground">Please log in to view this page.</div>
      </div>
    )
  }

  if (user.role !== "company_owner" && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-8 h-8 text-destructive mb-2" />
        <div className="text-lg font-semibold">You are not authorized to manage subscriptions.</div>
        <div className="text-muted-foreground">Only company owners or admins can view this page.</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <CreditCard className="w-7 h-7" /> Subscriptions
      </h1>
      <p className="text-muted-foreground mb-6">Manage your company's subscription plan. Upgrade, downgrade, or manage your billing securely via Stripe.</p>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your company's active plan and billing status.</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{subscription.plan}</span>
                <Badge className="capitalize" variant="outline">{subscription.status}</Badge>
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="destructive">Canceling</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Renews on <span className="font-medium">{new Date(subscription.renewsAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="w-5 h-5" /> No active subscription
            </div>
          )}
        </CardContent>
        {subscription && (
          <CardFooter>
            <Button onClick={handleManage} disabled={manageLoading}>
              {manageLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />} Manage Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card key={plan.id} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{plan.name}</CardTitle>
              <CardDescription className="text-2xl font-bold mt-2">{plan.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-4 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              {subscription && subscription.plan === plan.name ? (
                <Button disabled variant="secondary">Current Plan</Button>
              ) : (
                <Button onClick={() => handleSubscribe(plan.stripePriceId)} disabled={!!checkoutLoading}>
                  {checkoutLoading === plan.stripePriceId ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />} Subscribe
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Success/Cancel Messages */}
      {searchParams.get('success') && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment successful!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your subscription has been activated. You can now access all features of your plan.
            </p>
          </CardContent>
        </Card>
      )}

      {searchParams.get('canceled') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Payment canceled</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Your payment was canceled. You can try again anytime.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 