import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SIGNED_OUT_COOKIE } from '@/lib/admin-auth-shared';

export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  const loginUrl = new URL('/auth/login', request.nextUrl.origin);
  loginUrl.searchParams.set('returnTo', '/backoffice');
  loginUrl.searchParams.set('prompt', 'login');
  loginUrl.searchParams.set('max_age', '0');

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(ADMIN_SIGNED_OUT_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
