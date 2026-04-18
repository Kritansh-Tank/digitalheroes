import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { generateRandomNumbers, generateAlgorithmicNumbers, detectMatch, distributePrizes } from '@/lib/draw-engine';

// GET: list all draws
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin
    .from('draws')
    .select('*, draw_results(*), prize_pool_config(*)')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draws: data });
}

// POST: create a new draw
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { month, year, logic_type = 'random' } = body;
  if (!month || !year) return NextResponse.json({ error: 'month and year required' }, { status: 400 });

  const { data: draw, error } = await supabaseAdmin
    .from('draws')
    .insert({ month, year, logic_type, status: 'draft' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Set fixed prize pool config
  await supabaseAdmin.from('prize_pool_config').insert({
    draw_id: draw.id, five_pct: 40, four_pct: 35, three_pct: 25,
  });

  // Auto-generate draw entries for all active subscribers from their scores
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active');

  if (subs && subs.length > 0) {
    const entries = subs.map((s: { user_id: string }) => ({
      draw_id: draw.id,
      user_id: s.user_id,
      numbers: generateRandomNumbers(), // placeholder — real numbers from scores
    }));
    await supabaseAdmin.from('draw_entries').upsert(entries, { onConflict: 'draw_id,user_id' });
  }

  return NextResponse.json({ draw }, { status: 201 });
}

// PATCH: simulate or publish a draw
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { drawId, action } = body; // action: 'simulate' | 'publish'
  if (!drawId || !action) return NextResponse.json({ error: 'drawId and action required' }, { status: 400 });

  // Fetch draw
  const { data: draw } = await supabaseAdmin.from('draws').select('*').eq('id', drawId).single();
  if (!draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 });

  // Get score frequency for algorithmic mode
  let scoreFrequency: Record<number, number> = {};
  if (draw.logic_type === 'algorithmic') {
    const { data: allScores } = await supabaseAdmin.from('golf_scores').select('score');
    if (allScores) {
      allScores.forEach((s: { score: number }) => {
        scoreFrequency[s.score] = (scoreFrequency[s.score] ?? 0) + 1;
      });
    }
  }

  const winningNumbers =
    draw.logic_type === 'algorithmic'
      ? generateAlgorithmicNumbers(scoreFrequency)
      : generateRandomNumbers();

  // Count active subscribers for prize pool
  const { count: activeCount } = await supabaseAdmin
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const prizePool = (activeCount ?? 0) * 999 * 0.5; // 50% of £9.99 each
  const prizes = distributePrizes(Math.round(prizePool), draw.jackpot_rollover_amount);

  if (action === 'simulate') {
    await supabaseAdmin.from('draws').update({ status: 'simulated' }).eq('id', drawId);
    return NextResponse.json({ winningNumbers, prizePool: prizes, status: 'simulated' });
  }

  if (action === 'publish') {
    // Save draw result
    await supabaseAdmin.from('draw_results').upsert({
      draw_id: drawId,
      winning_numbers: winningNumbers,
      prize_pool_total: Math.round(prizePool + draw.jackpot_rollover_amount),
    }, { onConflict: 'draw_id' });

    // Match all entries
    const { data: entries } = await supabaseAdmin
      .from('draw_entries')
      .select('user_id, numbers')
      .eq('draw_id', drawId);

    const fiveWinners: string[] = [], fourWinners: string[] = [], threeWinners: string[] = [];

    entries?.forEach((e: { user_id: string; numbers: number[] }) => {
      const match = detectMatch(e.numbers, winningNumbers);
      if (match === '5') fiveWinners.push(e.user_id);
      else if (match === '4') fourWinners.push(e.user_id);
      else if (match === '3') threeWinners.push(e.user_id);
    });

    const winnerRows: { draw_id: string; user_id: string; match_type: string; prize_amount: number }[] = [];

    // Jackpot rollover if no 5-match
    let nextRollover = 0;
    if (fiveWinners.length === 0) {
      nextRollover = prizes.fiveMatch;
    } else {
      const each = Math.floor(prizes.fiveMatch / fiveWinners.length);
      fiveWinners.forEach((uid) => winnerRows.push({ draw_id: drawId, user_id: uid, match_type: '5', prize_amount: each }));
    }

    const fourEach = fourWinners.length > 0 ? Math.floor(prizes.fourMatch / fourWinners.length) : 0;
    fourWinners.forEach((uid) => winnerRows.push({ draw_id: drawId, user_id: uid, match_type: '4', prize_amount: fourEach }));

    const threeEach = threeWinners.length > 0 ? Math.floor(prizes.threeMatch / threeWinners.length) : 0;
    threeWinners.forEach((uid) => winnerRows.push({ draw_id: drawId, user_id: uid, match_type: '3', prize_amount: threeEach }));

    if (winnerRows.length > 0) {
      await supabaseAdmin.from('winners').insert(winnerRows);
    }

    await supabaseAdmin.from('draws').update({
      status: 'published',
      published_at: new Date().toISOString(),
      jackpot_rollover_amount: nextRollover,
    }).eq('id', drawId);

    return NextResponse.json({ winningNumbers, winners: winnerRows.length, jackpotRolledOver: nextRollover > 0 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
