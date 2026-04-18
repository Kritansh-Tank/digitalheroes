import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const scoreSchema = z.object({
  score: z.number().int().min(1).max(45),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// GET: fetch user's scores (reverse chronological)
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('golf_scores')
    .select('*')
    .eq('user_id', user.userId)
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data });
}

// POST: add new score (rolling-5 logic)
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = scoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Score must be 1–45 and include a valid date' }, { status: 400 });
    }
    const { score, date } = parsed.data;

    // Check for duplicate date
    const { data: existing } = await supabaseAdmin
      .from('golf_scores')
      .select('id')
      .eq('user_id', user.userId)
      .eq('date', date)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A score for this date already exists. Edit or delete it.' }, { status: 409 });
    }

    // Get current scores ordered by date ASC (oldest first)
    const { data: currentScores } = await supabaseAdmin
      .from('golf_scores')
      .select('id, date')
      .eq('user_id', user.userId)
      .order('date', { ascending: true });

    // Rolling-5: delete oldest if already at 5
    if (currentScores && currentScores.length >= 5) {
      const oldest = currentScores[0];
      await supabaseAdmin.from('golf_scores').delete().eq('id', oldest.id);
    }

    // Insert new score
    const { data: newScore, error } = await supabaseAdmin
      .from('golf_scores')
      .insert({ user_id: user.userId, score, date })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ score: newScore }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
