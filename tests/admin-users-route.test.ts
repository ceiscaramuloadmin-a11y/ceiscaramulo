/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createAuth0PasswordUser = vi.fn();
const deleteAuth0User = vi.fn();
const syncAuth0AdminRole = vi.fn();
const requireAdminContextFromRequest = vi.fn();
const canManageAdmins = vi.fn();
const getAdminByEmail = vi.fn();
const listAdminUsers = vi.fn();
const saveAdminUsers = vi.fn();
const appendAuditLog = vi.fn();
const saveAdminPermissions = vi.fn();
const deleteAdminPermissions = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/auth0-management', () => ({
  createAuth0PasswordUser,
  deleteAuth0User,
  syncAuth0AdminRole,
}));

vi.mock('@/app/api/_lib/cms', () => ({
  appendAuditLog,
  canManageAdmins,
  deleteAdminPermissions,
  getAdminByEmail,
  jsonError,
  listAdminUsers,
  requireAdminContextFromRequest,
  saveAdminPermissions,
  saveAdminUsers,
}));

describe('admin users route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['admins'] },
      error: null,
    });
    canManageAdmins.mockReturnValue(true);
    getAdminByEmail.mockResolvedValue(null);
    listAdminUsers.mockResolvedValue([]);
    createAuth0PasswordUser.mockResolvedValue({
      id: 'auth0|new-admin',
      email: 'novo@ceis.pt',
    });
    syncAuth0AdminRole.mockResolvedValue(undefined);
    saveAdminUsers.mockResolvedValue(undefined);
    appendAuditLog.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('creates a new admin in Auth0 and persists it locally', async () => {
    const { POST } = await import('@/app/api/admin/users/route');
    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'novo@ceis.pt',
          role: 'editor',
          password: 'SenhaSegura123!',
          generatePassword: false,
        }),
      }) as never
    );

    expect(createAuth0PasswordUser).toHaveBeenCalledWith({
      email: 'novo@ceis.pt',
      password: 'SenhaSegura123!',
    });
    expect(syncAuth0AdminRole).toHaveBeenCalledWith('auth0|new-admin', 'editor');
    expect(saveAdminUsers).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'auth0|new-admin',
        email: 'novo@ceis.pt',
        role: 'editor',
        createdBy: 'owner@ceis.pt',
      }),
    ]);
    expect(response.status).toBe(201);
  });

  it('rolls back the Auth0 user when local persistence fails', async () => {
    saveAdminUsers.mockRejectedValue(new Error('db failed'));

    const { POST } = await import('@/app/api/admin/users/route');
    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'novo@ceis.pt',
          role: 'editor',
          password: 'SenhaSegura123!',
          generatePassword: false,
        }),
      }) as never
    );

    expect(deleteAuth0User).toHaveBeenCalledWith('auth0|new-admin');
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'db failed' });
  });

  it('synchronizes the Auth0 role when an admin role changes', async () => {
    listAdminUsers.mockResolvedValue([
      {
        id: 'auth0|new-admin',
        email: 'novo@ceis.pt',
        role: 'editor',
        permissions: ['news'],
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'owner@ceis.pt',
      },
    ]);

    const { PATCH } = await import('@/app/api/admin/users/route');
    const response = await PATCH(
      new Request('http://localhost/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'novo@ceis.pt',
          role: 'owner',
        }),
      }) as never
    );

    expect(syncAuth0AdminRole).toHaveBeenCalledWith('auth0|new-admin', 'owner');
    expect(saveAdminPermissions).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('removes the Auth0 user when an admin is deleted', async () => {
    listAdminUsers.mockResolvedValue([
      {
        id: 'auth0|new-admin',
        email: 'novo@ceis.pt',
        role: 'editor',
        permissions: ['news'],
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'owner@ceis.pt',
      },
    ]);

    const { DELETE } = await import('@/app/api/admin/users/route');
    const request = new Request('http://localhost/api/admin/users?email=novo@ceis.pt', {
      method: 'DELETE',
    }) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await DELETE(
      request as never
    );

    expect(deleteAdminPermissions).toHaveBeenCalledWith('novo@ceis.pt');
    expect(deleteAuth0User).toHaveBeenCalledWith('auth0|new-admin');
    expect(response.status).toBe(204);
  });

  it('rejects non-owner admin creation attempts', async () => {
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'editor@ceis.pt', role: 'editor', permissions: ['admins'] },
      error: null,
    });

    const { POST } = await import('@/app/api/admin/users/route');
    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'novo@ceis.pt',
          role: 'editor',
        }),
      }) as never
    );

    expect(createAuth0PasswordUser).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
