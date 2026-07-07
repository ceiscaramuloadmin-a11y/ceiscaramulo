/* @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { ADMIN_SIGNED_OUT_COOKIE } from '@/lib/admin-auth-shared';

describe('admin Auth0 login route', () => {
  it('clears the signed out marker and redirects to Auth0 with a forced login prompt', async () => {
    const { GET } = await import('@/app/api/admin/auth0-login/route');
    const response = GET(new NextRequest('https://www.ceiscaramulo.pt/api/admin/auth0-login'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://www.ceiscaramulo.pt/auth/login?returnTo=%2Fbackoffice&prompt=login&max_age=0'
    );
    expect(response.headers.get('set-cookie')).toContain(`${ADMIN_SIGNED_OUT_COOKIE}=`);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
