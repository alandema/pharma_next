import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth';

// Basic protection example (expand paths & role checks later)
export function middleware(req: NextRequest) {
  const protectedPrefixes = ['/patients', '/medications', '/cids', '/prescriptions'];
  const pathname = req.nextUrl.pathname;
  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get('auth_token')?.value;
    const user = token && verifyToken(token);
    if (!user) {
      const loginUrl = new URL('/', req.url); // redirect to home/login
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|api/auth/login|api/auth/me|api/auth/logout|favicon.ico).*)'] };
