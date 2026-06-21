/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    adminAuditLog: {
      deleteMany: prismaMocks.deleteMany,
      findMany: prismaMocks.findMany,
      create: prismaMocks.create,
    },
    adminUser: {
      findUnique: prismaMocks.findUnique,
    },
    siteSetting: {
      findUnique: prismaMocks.siteSettingFindUnique,
      upsert: prismaMocks.siteSettingUpsert,
    },
  },
}));

vi.mock('@/lib/admin-auth-server', () => ({
  getAdminAuthSession: vi.fn(),
}));

describe('audit log retention', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T12:00:00.000Z'));
    prismaMocks.deleteMany.mockResolvedValue({ count: 0 });
    prismaMocks.findMany.mockResolvedValue([]);
    prismaMocks.create.mockResolvedValue({});
    prismaMocks.findUnique.mockResolvedValue({ id: 'admin_1' });
    prismaMocks.siteSettingFindUnique.mockResolvedValue(null);
    prismaMocks.siteSettingUpsert.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calculates the audit cleanup cutoff at 15 days', async () => {
    const { AUDIT_LOG_RETENTION_DAYS, getAuditLogRetentionCutoff } = await import('@/app/api/_lib/cms');

    expect(AUDIT_LOG_RETENTION_DAYS).toBe(15);
    expect(getAuditLogRetentionCutoff(new Date('2026-06-02T12:00:00.000Z')).toISOString()).toBe(
      '2026-05-18T12:00:00.000Z'
    );
  });

  it('deletes expired audit logs before listing the history', async () => {
    const { listAuditLogs } = await import('@/app/api/_lib/cms');

    await listAuditLogs();

    expect(prismaMocks.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          lte: new Date('2026-05-18T12:00:00.000Z'),
        },
      },
    });
    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  });

  it('deletes expired audit logs before recording a new change', async () => {
    const { appendAuditLog } = await import('@/app/api/_lib/cms');

    await appendAuditLog({
      actor: {
        email: 'admin@example.pt',
        role: 'owner',
        permissions: ['audit'],
      },
      action: 'update',
      targetType: 'layout',
      targetId: 'global',
      summary: 'Atualizou a aparência',
    });

    expect(prismaMocks.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMocks.create.mock.invocationCallOrder[0]
    );
    expect(prismaMocks.create).toHaveBeenCalledTimes(1);
  });

  it('lists stored audit history when the dedicated audit table is missing in production', async () => {
    prismaMocks.deleteMany.mockRejectedValue({ code: 'P2021', message: 'The table admin_audit_logs does not exist' });
    prismaMocks.findMany.mockRejectedValue({ code: 'P2021', message: 'The table admin_audit_logs does not exist' });
    prismaMocks.siteSettingFindUnique.mockResolvedValue({
      value: JSON.stringify([
        {
          id: 'stored-1',
          createdAt: '2026-06-02T11:00:00.000Z',
          actorEmail: 'admin@example.pt',
          actorRole: 'owner',
          action: 'update',
          targetType: 'news',
          targetId: 'n1',
          summary: 'Atualização de registo na secção news.',
        },
      ]),
    });

    const { listAuditLogs } = await import('@/app/api/_lib/cms');

    await expect(listAuditLogs()).resolves.toEqual([
      expect.objectContaining({
        id: 'stored-1',
        summary: 'Atualização de registo na secção news.',
      }),
    ]);
  });

  it('records new audit entries in site settings when the dedicated audit table is missing', async () => {
    prismaMocks.deleteMany.mockRejectedValue({ code: 'P2021', message: 'The table admin_audit_logs does not exist' });
    prismaMocks.create.mockRejectedValue({ code: 'P2021', message: 'The table admin_audit_logs does not exist' });
    prismaMocks.siteSettingFindUnique.mockResolvedValue({ value: '[]' });

    const { appendAuditLog } = await import('@/app/api/_lib/cms');

    await appendAuditLog({
      actor: {
        email: 'admin@example.pt',
        role: 'owner',
        permissions: ['audit'],
      },
      action: 'update',
      targetType: 'news',
      targetId: 'n1',
      summary: 'Atualização de registo na secção news.',
      before: { title: 'Antigo' },
      after: { title: 'Novo' },
    });

    expect(prismaMocks.siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: 'admin_audit_logs' },
      create: {
        key: 'admin_audit_logs',
        value: expect.stringContaining('Atualização de registo na secção news.'),
      },
      update: {
        value: expect.stringContaining('Atualização de registo na secção news.'),
      },
    });
  });
});
