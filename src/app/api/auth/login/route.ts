import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername, verifyPassword, signToken } from '@/src/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    const user = await findUserByUsername(username);
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const ok = await verifyPassword(password, (user as any).password_hash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = signToken({ id: (user as any).id, username: (user as any).username, role: (user as any).role });
    const res = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
    res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return res;
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
