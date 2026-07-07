/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('admin auth runtime mode', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_AUTH_MODE', 'runtime');
  });

  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('returns an Auth0 guidance error when runtime sign-in is attempted with email/password', async () => {
    const { adminAuthClient } = await import('@/lib/admin-auth');

    await expect(
      adminAuthClient.adapter.signIn.email({
        email: 'admin@ceis.pt',
        password: 'segredo',
      })
    ).resolves.toEqual({
      data: null,
      error: {
        message: 'O login administrativo runtime passou a usar Auth0. Use o botão "Entrar com Auth0".',
      },
    });
  });

  it('normalizes loopback Auth0 login links to localhost in development', async () => {
    const { getAuth0AdminLoginHref } = await import('@/lib/admin-auth');

    expect(getAuth0AdminLoginHref({ hostname: '127.0.0.1', port: '3000', protocol: 'http:' })).toBe(
      'http://localhost:3000/auth/login?returnTo=%2Fbackoffice'
    );
    expect(getAuth0AdminLoginHref({ hostname: '127.0.0.1', port: '3000', protocol: 'http:' }, { promptLogin: true })).toBe(
      'http://localhost:3000/api/admin/auth0-login'
    );
    expect(getAuth0AdminLoginHref({ hostname: 'localhost', port: '3000', protocol: 'http:' })).toBe('/auth/login?returnTo=%2Fbackoffice');
  });

  it('builds an Auth0 logout URL with an absolute backoffice login return URL', async () => {
    const { getAuth0AdminLogoutHref } = await import('@/lib/admin-auth');

    expect(getAuth0AdminLogoutHref({ hostname: 'www.ceiscaramulo.pt', port: '', protocol: 'https:' })).toBe(
      'https://www.ceiscaramulo.pt/auth/logout?returnTo=https%3A%2F%2Fwww.ceiscaramulo.pt%2Fbackoffice%2Flogin'
    );
    expect(getAuth0AdminLogoutHref({ hostname: '127.0.0.1', port: '3000', protocol: 'http:' })).toBe(
      'http://localhost:3000/auth/logout?returnTo=http%3A%2F%2Flocalhost%3A3000%2Fbackoffice%2Flogin'
    );
  });

  it('marks Auth0 runtime sign out so sessions are not restored automatically on reload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const { ADMIN_FORCE_AUTH0_LOGIN_KEY, adminAuthClient } = await import('@/lib/admin-auth');

    await adminAuthClient.adapter.signOut();
    const sessionResult = await adminAuthClient.adapter.getSession();

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/session', { method: 'DELETE' });
    expect(window.sessionStorage.getItem(ADMIN_FORCE_AUTH0_LOGIN_KEY)).toBe('1');
    expect(window.localStorage.getItem(ADMIN_FORCE_AUTH0_LOGIN_KEY)).toBe('1');
    expect(sessionResult).toEqual({ data: null });
  });
});
