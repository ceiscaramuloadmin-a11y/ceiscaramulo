/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyAdminSessionToken = vi.fn();
const getAdminByEmail = vi.fn();
const listAdminUsers = vi.fn();
const saveAdminUsers = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/admin-auth-server', () => ({
  verifyAdminSessionToken,
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

  it('returns a Firebase-backed session for an active admin', async () => {
    verifyAdminSessionToken.mockResolvedValue({
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
        headers: {
          Authorization: 'Bearer firebase-token',
        },
      }) as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      token: 'firebase-token',
      session: {
        email: 'admin@ceis.pt',
        role: 'owner',
        permissions: ['news', 'admins'],
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
    });
  });

  it('bootstraps the first admin when the admin list is empty', async () => {
    verifyAdminSessionToken.mockResolvedValue({
      email: 'first@ceis.pt',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    getAdminByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({
      email: 'first@ceis.pt',
      role: 'owner',
      permissions: ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'],
      active: true,
    });
    listAdminUsers.mockResolvedValue([]);
    saveAdminUsers.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer first-token',
        },
      }) as never
    );

    expect(response.status).toBe(200);
    expect(saveAdminUsers).toHaveBeenCalledTimes(1);
  });

  it('returns a 401 payload when Firebase validation fails', async () => {
    verifyAdminSessionToken.mockRejectedValue(new Error('Sessão Firebase inválida ou em falta.'));

    const { POST } = await import('@/app/api/admin/session/route');
    const response = await POST(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer broken-token',
        },
      }) as never
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Sessão Firebase inválida ou em falta.' });
  });
});
