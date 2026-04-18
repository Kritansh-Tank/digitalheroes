import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

// Subscription plan price IDs — create these in the Stripe dashboard
// or use the checkout session with price_data for demo
export const PLANS = {
  monthly: {
    name: 'Monthly Plan',
    amount: 999, // £9.99 in pence
    currency: 'gbp',
    interval: 'month' as const,
  },
  yearly: {
    name: 'Yearly Plan',
    amount: 8999, // £89.99 in pence (≈25% discount)
    currency: 'gbp',
    interval: 'year' as const,
  },
} as const;
