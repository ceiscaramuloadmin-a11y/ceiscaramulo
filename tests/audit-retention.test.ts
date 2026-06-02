/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
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
});
