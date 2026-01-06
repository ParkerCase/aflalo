# Stripe Subscription Setup Guide

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_... # Starter plan price ID
STRIPE_PRO_PRICE_ID=price_... # Professional plan price ID
STRIPE_ENTERPRISE_PRICE_ID=price_... # Enterprise plan price ID

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Your app URL
```

## Database Tables Required

### 1. `stripe_customers` table

```sql
CREATE TABLE stripe_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `subscriptions` table (if not exists)

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Update `companies` table (if needed)

```sql
-- Add these columns if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT;
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create three products:
   - **Starter** - $29/month
   - **Professional** - $99/month
   - **Enterprise** - Custom pricing
3. For each product, create a recurring price (monthly billing)
4. Copy the Price IDs and add them to your environment variables

### 2. Set up Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/subscriptions/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook secret and add it to your environment variables

### 3. Configure Customer Portal

1. Go to [Stripe Dashboard > Settings > Billing > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the customer portal
3. Configure allowed features:
   - ✅ Update payment methods
   - ✅ Cancel subscriptions
   - ✅ Update billing information
   - ✅ Download invoices

## Testing

### 1. Test Cards

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### 2. Test Flow

1. Visit `/company/subscription`
2. Click "Subscribe" on any plan
3. Complete checkout with test card
4. Verify subscription appears in Stripe dashboard
5. Test "Manage Subscription" button
6. Test webhook events in Stripe dashboard

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Test webhook signature verification
- [ ] Set up proper error monitoring
- [ ] Configure email notifications for failed payments
- [ ] Set up subscription analytics
- [ ] Test subscription cancellation flow
- [ ] Verify customer portal configuration

## API Endpoints Created

- `POST /api/stripe/checkout` - Create Stripe Checkout session
- `POST /api/stripe/portal` - Create Customer Portal session
- `GET /api/stripe/subscription` - Get current subscription
- `POST /api/subscriptions/webhooks/stripe` - Handle Stripe webhooks

## Frontend Features

- ✅ Real-time subscription status
- ✅ Plan comparison and selection
- ✅ Secure checkout flow
- ✅ Customer portal integration
- ✅ Success/error handling
- ✅ Loading states
- ✅ Access control (owners/admins only)

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**

   - Check webhook secret in environment variables
   - Verify webhook endpoint URL is correct

2. **"No Stripe customer found"**

   - Customer record not created in database
   - Check webhook events are firing

3. **Checkout session creation fails**

   - Verify Stripe secret key
   - Check price IDs are correct
   - Ensure user has proper permissions

4. **Subscription not updating**
   - Check webhook events in Stripe dashboard
   - Verify database table structure
   - Check server logs for errors

### Debug Mode

Add this to see detailed logs:

```bash
DEBUG=stripe:* npm run dev
```

## Support

For Stripe-specific issues, check the [Stripe Documentation](https://stripe.com/docs) or contact Stripe Support.

For app-specific issues, check the server logs and browser console for error messages.
