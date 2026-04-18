import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const { data: user, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (lookupError) {
      console.error('[login] lookup error:', lookupError);
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role, fullName: user.full_name });
    await setAuthCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
