import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
        .from('charity_selections')
        .select('charity_id, contribution_pct, charities(name)')
        .eq('user_id', user.userId)
        .maybeSingle();

    if (error) {
        console.error('[charity_selection] fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ selection: data });
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { charityId } = await req.json();
        if (!charityId) return NextResponse.json({ error: 'Charity ID required' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('charity_selections')
            .upsert({
                user_id: user.userId,
                charity_id: charityId,
                contribution_pct: 10, // Default 10%
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ selection: data });
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
