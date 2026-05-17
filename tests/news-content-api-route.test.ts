/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  newsCreate,
  newsFindUnique,
  newsUpdate,
  requireAdminContextFromRequest,
  appendAuditLog,
  hasAdminPermission,
  enqueueNewsPublishedNotifications,
} = vi.hoisted(() => ({
  newsCreate: vi.fn(),
  newsFindUnique: vi.fn(),
  newsUpdate: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  appendAuditLog: vi.fn(),
  hasAdminPermission: vi.fn(),
  enqueueNewsPublishedNotifications: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    news: {
      create: newsCreate,
      findUnique: newsFindUnique,
      update: newsUpdate,
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    contentComment: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/newsletter-on-publish', () => ({
  enqueueNewsPublishedNotifications,
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

function newsForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set('title', overrides.title ?? 'Título');
  formData.set('slug', overrides.slug ?? 'titulo');
  formData.set('excerpt', overrides.excerpt ?? '<p>Resumo</p>');
  formData.set('content', overrides.content ?? '<p>Corpo</p>');
  formData.set('author', overrides.author ?? 'Equipa');
  if (overrides.published !== undefined) {
    formData.set('published', overrides.published);
  } else {
    formData.set('published', 'false');
  }
  if (overrides.publishedAt) {
    formData.set('publishedAt', overrides.publishedAt);
  }
  return formData;
}

describe('news content API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: [] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    appendAuditLog.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('POST /api/[section] creates news, audits, and notifies newsletter hook', async () => {
    newsCreate.mockResolvedValue({
      id: 'n1',
      title: 'Título',
      slug: 'titulo',
      excerpt: '<p>Resumo</p>',
      content: '<p>Corpo</p>',
      author: 'Equipa',
      published: false,
      category: 'Geral',
      publishedAt: null,
      image: null,
    });

    const { POST } = await import('@/app/api/[section]/route');
    const request = new NextRequest('http://localhost/api/news', {
      method: 'POST',
      body: newsForm(),
    });

    const response = await POST(request, { params: Promise.resolve({ section: 'news' }) });

    expect(response.status).toBe(201);
    expect(newsCreate).toHaveBeenCalledWith({
      data: {
        title: 'Título',
        slug: 'titulo',
        excerpt: '<p>Resumo</p>',
        content: '<p>Corpo</p>',
        category: 'Geral',
        author: 'Equipa',
        published: false,
        publishedAt: null,
        image: null,
      },
    });
    expect(appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        targetType: 'news',
        targetId: 'n1',
      })
    );
    expect(enqueueNewsPublishedNotifications).toHaveBeenCalledWith(null, {
      slug: 'titulo',
      title: 'Título',
      excerpt: '<p>Resumo</p>',
      published: false,
    });
  });

  it('PUT /api/[section]/[identifier] updates news and passes previous published state to newsletter hook', async () => {
    newsFindUnique.mockResolvedValue({
      id: 'id-1',
      title: 'Antigo',
      slug: 'antigo',
      excerpt: '<p>antigo</p>',
      content: '<p>corpo</p>',
      author: 'Equipa',
      published: false,
      category: 'Geral',
      publishedAt: null,
      image: null,
    });

    newsUpdate.mockResolvedValue({
      id: 'id-1',
      title: 'Novo',
      slug: 'novo-slug',
      excerpt: '<p>novo</p>',
      content: '<p>novo corpo</p>',
      author: 'Equipa',
      published: true,
      category: 'Geral',
      publishedAt: new Date('2026-01-15T12:00:00.000Z'),
      image: null,
    });

    const { PUT } = await import('@/app/api/[section]/[identifier]/route');
    const formData = newsForm({
      title: 'Novo',
      slug: 'novo-slug',
      excerpt: '<p>novo</p>',
      content: '<p>novo corpo</p>',
      published: 'true',
      publishedAt: '2026-01-15T12:00:00.000Z',
    });

    const request = new NextRequest('http://localhost/api/news/id-1', {
      method: 'PUT',
      body: formData,
    });

    const response = await PUT(request, {
      params: Promise.resolve({ section: 'news', identifier: 'id-1' }),
    });

    expect(response.status).toBe(200);
    expect(newsUpdate).toHaveBeenCalled();
    expect(appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        targetType: 'news',
        targetId: 'id-1',
      })
    );
    expect(enqueueNewsPublishedNotifications).toHaveBeenCalledWith(false, {
      slug: 'novo-slug',
      title: 'Novo',
      excerpt: '<p>novo</p>',
      published: true,
    });
  });
});
