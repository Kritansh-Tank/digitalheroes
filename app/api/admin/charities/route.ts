import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const charitySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// POST: create charity (admin only)
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = charitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('charities').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ charity: data }, { status: 201 });
}

// PATCH: update charity
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'charity id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('charities').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ charity: data });
}

// DELETE: soft-delete (set active=false)
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await supabaseAdmin.from('charities').update({ active: false }).eq('id', id);
  return NextResponse.json({ success: true });
}
