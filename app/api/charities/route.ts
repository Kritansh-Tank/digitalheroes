import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const charitySchema = z.object({
  charity_id: z.string().uuid(),
  contribution_pct: z.number().int().min(10).max(100).default(10),
});

// GET: all active charities (public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('charities')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ charities: data });
}

// POST: user selects their charity
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = charitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { charity_id, contribution_pct } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('charity_selections')
    .upsert({ user_id: user.userId, charity_id, contribution_pct }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ selection: data });
}
