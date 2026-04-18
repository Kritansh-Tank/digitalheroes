import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// GET: all winners (admin) or own winnings (user)
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabaseAdmin
    .from('winners')
    .select('*, users(full_name, email), draws(month, year)');

  if (user.role !== 'admin') {
    query = query.eq('user_id', user.userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ winners: data });
}

// PATCH: verify winner or mark as paid (admin), or upload proof (user)
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { winnerId, proof_url, verified, paid_out } = body;
  if (!winnerId) return NextResponse.json({ error: 'winnerId required' }, { status: 400 });

  let updates: Record<string, unknown> = {};

  if (user.role === 'admin') {
    if (verified !== undefined) updates.verified = verified;
    if (paid_out !== undefined) updates.paid_out = paid_out;
  } else {
    // User can only upload their own proof
    if (proof_url) {
      const { data: w } = await supabaseAdmin.from('winners').select('user_id').eq('id', winnerId).single();
      if (!w || w.user_id !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      updates.proof_url = proof_url;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('winners')
    .update(updates)
    .eq('id', winnerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ winner: data });
}
