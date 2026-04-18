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
