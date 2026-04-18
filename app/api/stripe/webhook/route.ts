import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook signature failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata: Record<string, string>; subscription: string; customer: string };
    const { userId, plan } = session.metadata;

    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    const periodEnd = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000);

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      plan,
      status: 'active',
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'user_id' });
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as { metadata: Record<string, string> };
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', (sub as unknown as { id: string }).id);
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as unknown as { id: string; status: string; current_period_end: number };
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: sub.status === 'active' ? 'active' : 'lapsed',
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', sub.id);
  }

  return NextResponse.json({ received: true });
}
