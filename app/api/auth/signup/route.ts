import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { email, password, full_name } = parsed.data;

    // Check existing user — use maybeSingle() so no-rows doesn't throw
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (lookupError) {
      console.error('[signup] lookup error:', lookupError);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);

    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({ email: email.toLowerCase(), full_name, password_hash, role: 'user' })
      .select('id, email, full_name, role')
      .single();

    if (insertError || !user) {
      console.error('[signup] insert error:', insertError);
      return NextResponse.json({ error: insertError?.message ?? 'Failed to create user' }, { status: 500 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role, fullName: user.full_name });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error('[signup] unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
