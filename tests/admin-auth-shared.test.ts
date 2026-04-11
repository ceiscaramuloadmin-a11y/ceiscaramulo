import { describe, expect, it } from 'vitest';
import {
  createSessionExpiryDate,
  getDefaultAdminPermissions,
  normalizeAdminSession,
  parseAdminPermissions,
} from '@/lib/admin-auth-shared';

describe('admin-auth-shared', () => {
  it('gives owners every admin permission', () => {
    expect(getDefaultAdminPermissions('owner')).toEqual([
      'news',
      'activities',
      'projects',
      'publications',
      'contacts',
      'gallery',
      'layout',
      'admins',
      'audit',
    ]);
  });

  it('filters invalid editor permissions and falls back when empty', () => {
    expect(parseAdminPermissions(['news', 'invalid', 'gallery'], 'editor')).toEqual(['news', 'gallery']);
    expect(parseAdminPermissions([], 'editor')).toEqual(['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'audit']);
  });

  it('normalizes a persisted admin session', () => {
    expect(
      normalizeAdminSession({
        token: 'abc',
        email: 'ADMIN@CEIS.PT',
        role: 'owner',
        permissions: ['news'],
        expiresAt: '2099-01-01T00:00:00.000Z',
        mode: 'runtime',
      })
    ).toEqual({
      token: 'abc',
      email: 'admin@ceis.pt',
      role: 'owner',
      permissions: ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'],
      expiresAt: '2099-01-01T00:00:00.000Z',
      mode: 'runtime',
    });
  });

  it('creates future expiries', () => {
    expect(new Date(createSessionExpiryDate()).getTime()).toBeGreaterThan(Date.now());
  });
});
