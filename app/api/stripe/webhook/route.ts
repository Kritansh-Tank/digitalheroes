import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
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
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId || !plan) {
        console.error("Missing metadata");
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      const sub = await stripe.subscriptions.retrieve(session.subscription);

      const periodEndTimestamp = (sub as any).current_period_end;
      const periodStartTimestamp = (sub as any).current_period_start;

      if (!periodEndTimestamp) {
        console.error("Invalid subscription object:", sub);
        return NextResponse.json({ error: "Invalid subscription data" }, { status: 500 });
      }

      const periodEnd = new Date(periodEndTimestamp * 1000).toISOString();

      const periodStart = periodStartTimestamp
        ? new Date(periodStartTimestamp * 1000).toISOString()
        : new Date().toISOString();

      const { error } = await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      }, { onConflict: 'user_id' });

      if (error) console.error(error);
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any;

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id);
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any;

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: sub.status === 'active' ? 'active' : 'lapsed',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Webhook handler crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}