import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Basic protection example (expand paths & role checks later)
export function proxy(req: NextRequest) {
  console.log('[PROXY] Running for path:');
  const protectedPrefixes = ['/patients', '/medications', '/cids', '/prescriptions'];
  const pathname = req.nextUrl.pathname;

  console.log('[PROXY] Running for path:', pathname);

  if (protectedPrefixes.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get('auth_token')?.value;
    console.log('[PROXY] Protected path, token exists:', !!token);

    const user = token && verifyToken(token);
    console.log('[PROXY] User verified:', !!user);

    if (!user) {
      console.log('[PROXY] Redirecting to home');
      const loginUrl = new URL('/', req.url); // redirect to home/login
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/patients/:path*',
    '/medications/:path*',
    '/cids/:path*',
    '/prescriptions/:path*'
  ]
};