/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
const findMany = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const requireAdminContextFromRequest = vi.fn();
const hasAdminPermission = vi.fn();
const appendAuditLog = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/prisma', () => ({
  default: {
    contactMessage: {
      create,
      findMany,
      findUnique,
      update,
    },
  },
}));

vi.mock('@/app/api/_lib/cms', () => ({
  appendAuditLog,
  hasAdminPermission,
  isValidEmail: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  jsonError,
  requireAdminContextFromRequest,
}));

describe('contact messages routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['contacts'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('creates a contact message from the public form payload', async () => {
    create.mockResolvedValue({ id: 'msg_1' });

    const { POST } = await import('@/app/api/contact-messages/route');
    const response = await POST(
      new Request('http://localhost/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Maria',
          email: 'maria@example.com',
          subject: 'Parceria',
          message: 'Gostaria de saber mais.',
        }),
      }) as never
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: 'msg_1',
      message: 'Mensagem enviada com sucesso. Obrigado pelo contacto.',
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Maria',
        email: 'maria@example.com',
        subject: 'Parceria',
        message: 'Gostaria de saber mais.',
      },
    });
  });

  it('lists contact messages for authorized admins', async () => {
    findMany.mockResolvedValue([
      {
        id: 'msg_1',
        name: 'Maria',
        email: 'maria@example.com',
        subject: 'Parceria',
        message: 'Gostaria de saber mais.',
        read: false,
        createdAt: new Date('2026-04-11T09:00:00.000Z'),
      },
    ]);

    const { GET } = await import('@/app/api/admin/contact-messages/route');
    const response = await GET(new Request('http://localhost/api/admin/contact-messages') as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: 'msg_1',
        name: 'Maria',
        email: 'maria@example.com',
        subject: 'Parceria',
        message: 'Gostaria de saber mais.',
        read: false,
        createdAt: '2026-04-11T09:00:00.000Z',
      },
    ]);
  });

  it('updates the read status of a contact message', async () => {
    findUnique.mockResolvedValue({
      id: 'msg_1',
      name: 'Maria',
      email: 'maria@example.com',
      subject: 'Parceria',
      message: 'Gostaria de saber mais.',
      read: false,
      createdAt: new Date('2026-04-11T09:00:00.000Z'),
    });
    update.mockResolvedValue({
      id: 'msg_1',
      name: 'Maria',
      email: 'maria@example.com',
      subject: 'Parceria',
      message: 'Gostaria de saber mais.',
      read: true,
      createdAt: new Date('2026-04-11T09:00:00.000Z'),
    });

    const { PATCH } = await import('@/app/api/admin/contact-messages/route');
    const response = await PATCH(
      new Request('http://localhost/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'msg_1', read: true }),
      }) as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: 'msg_1',
      name: 'Maria',
      email: 'maria@example.com',
      subject: 'Parceria',
      message: 'Gostaria de saber mais.',
      read: true,
      createdAt: '2026-04-11T09:00:00.000Z',
    });
    expect(appendAuditLog).toHaveBeenCalledTimes(1);
  });
});
