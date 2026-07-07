/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ADMIN_SIGNED_OUT_COOKIE } from '@/lib/admin-auth-shared';

const getAdminAuthSession = vi.fn();
const getAdminByEmail = vi.fn();
const listAdminUsers = vi.fn();
const saveAdminUsers = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/admin-auth-server', () => ({
  getAdminAuthSession,
}));

vi.mock('@/app/api/_lib/cms', () => ({
  getAdminByEmail,
  listAdminUsers,
  saveAdminUsers,
  jsonError,
}));

describe('admin session route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns an Auth0-backed session for an active admin', async () => {
    getAdminAuthSession.mockResolvedValue({
      uid: 'auth0|123',
      email: 'admin@ceis.pt',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    getAdminByEmail.mockResolvedValue({
      email: 'admin@ceis.pt',
      role: 'owner',
      permissions: ['news', 'admins'],
      active: true,
    });

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
      }) as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: null,
      session: {
        email: 'admin@ceis.pt',
        role: 'owner',
        permissions: ['news', 'admins'],
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    });
  });

  it('bootstraps the first admin when the admin list is empty', async () => {
    getAdminAuthSession.mockResolvedValue({
      uid: 'auth0|first',
      email: 'first@ceis.pt',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    getAdminByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({
      email: 'first@ceis.pt',
      role: 'owner',
      permissions: ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'],
      active: true,
    });
    listAdminUsers.mockResolvedValue([]);
    saveAdminUsers.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
      }) as never
    );

    expect(response.status).toBe(200);
    expect(saveAdminUsers).toHaveBeenCalledTimes(1);
    expect(saveAdminUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'auth0|first',
        email: 'first@ceis.pt',
        createdBy: 'auth0-bootstrap',
      }),
    ]);
  });

  it('returns a 401 payload when Auth0 validation fails', async () => {
    getAdminAuthSession.mockRejectedValue(new Error('Sessão Auth0 inválida ou em falta.'));

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Sessão Auth0 inválida ou em falta.' });
  });

  it('supports GET for runtime session introspection', async () => {
    getAdminAuthSession.mockResolvedValue({
      uid: 'auth0|123',
      email: 'admin@ceis.pt',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    getAdminByEmail.mockResolvedValue({
      email: 'admin@ceis.pt',
      role: 'owner',
      permissions: ['news', 'contacts', 'admins'],
      active: true,
    });

    const { GET } = await import('@/app/api/admin/session/route');
    const response = await GET(new Request('http://localhost/api/admin/session', { method: 'GET' }) as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: null,
      session: {
        email: 'admin@ceis.pt',
        role: 'owner',
        permissions: ['news', 'contacts', 'admins'],
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    });
  });

  it('marks runtime sessions as signed out when deleting the admin session', async () => {
    const { DELETE } = await import('@/app/api/admin/session/route');
    const response = await DELETE();

    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain(`${ADMIN_SIGNED_OUT_COOKIE}=1`);
  });

  it('does not recreate an admin session while the signed out marker is present', async () => {
    const { GET } = await import('@/app/api/admin/session/route');
    const request = new NextRequest('http://localhost/api/admin/session', {
      headers: {
        cookie: `${ADMIN_SIGNED_OUT_COOKIE}=1`,
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(getAdminAuthSession).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ message: 'Sessão terminada. Inicie sessão novamente.' });
  });
});
