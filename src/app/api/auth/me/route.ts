import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: payload });
}
