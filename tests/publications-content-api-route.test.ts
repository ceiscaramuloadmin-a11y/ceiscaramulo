/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  publicationCreate,
  requireAdminContextFromRequest,
  appendAuditLog,
  hasAdminPermission,
} = vi.hoisted(() => ({
  publicationCreate: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  appendAuditLog: vi.fn(),
  hasAdminPermission: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    news: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    publication: {
      create: publicationCreate,
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    contentComment: {
      deleteMany: vi.fn(),
    },
    siteSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/newsletter-on-publish', () => ({
  enqueueNewsPublishedNotifications: vi.fn(),
  enqueueActivityPublishedNotifications: vi.fn(),
}));

vi.mock('@/app/api/_lib/cms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/_lib/cms')>();
  return {
    ...actual,
    requireAdminContextFromRequest,
    appendAuditLog,
    hasAdminPermission,
  };
});

function publicationForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set('title', overrides.title ?? 'Recurso');
  formData.set('author', overrides.author ?? 'Equipa');
  formData.set('year', overrides.year ?? '2026');
  formData.set('type', overrides.type ?? 'documento');
  formData.set('description', overrides.description ?? '<p>Descricao</p>');
  formData.set('published', overrides.published ?? 'true');
  return formData;
}

describe('publications content route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasAdminPermission.mockReturnValue(true);
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['publications'] },
      error: null,
    });
    publicationCreate.mockImplementation(async ({ data }) => ({
      id: 'publication-1',
      ...data,
    }));
  });

  it('normalizes invalid resource types before creating publications', async () => {
    const { POST } = await import('@/app/api/[section]/route');

    const response = await POST(
      new NextRequest('http://localhost/api/publications', {
        method: 'POST',
        body: publicationForm({ type: 'ata' }),
      }),
      { params: Promise.resolve({ section: 'publications' }) }
    );

    expect(response.status).toBe(201);
    expect(publicationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Recurso',
        type: 'documento',
        published: true,
      }),
    });
  });

  it('returns a clear validation error when the publication year is invalid', async () => {
    const { POST } = await import('@/app/api/[section]/route');

    const response = await POST(
      new NextRequest('http://localhost/api/publications', {
        method: 'POST',
        body: publicationForm({ year: '' }),
      }),
      { params: Promise.resolve({ section: 'publications' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Ano inválido. Indica um ano com quatro dígitos.',
    });
    expect(publicationCreate).not.toHaveBeenCalled();
  });
});
