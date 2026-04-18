import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  score: z.number().int().min(1).max(45),
});

// PUT: edit score (same date only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid score value' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .update({ score: parsed.data.score })
    .eq('id', id)
    .eq('user_id', user.userId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Score not found or unauthorized' }, { status: 404 });
  return NextResponse.json({ score: data });
}

// DELETE: remove a score
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from('golf_scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.userId);

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ success: true });
}
