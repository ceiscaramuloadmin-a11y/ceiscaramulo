/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, findMany, findContent } = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  findContent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    contentComment: {
      create,
      findMany,
    },
  },
}));

vi.mock('@/app/api/_lib/cms', () => ({
  findContent,
  isContentSection: (value: string) => ['news', 'activities', 'projects', 'publications'].includes(value),
  jsonError: (message: string, status = 400) => Response.json({ message }, { status }),
}));

describe('public content comments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findContent.mockResolvedValue({ id: 'news-1', title: 'Notícia teste' });
  });

  it('creates a comment without requiring a public email field', async () => {
    create.mockResolvedValue({
      id: 'comment-1',
      contentType: 'news',
      contentId: 'news-1',
      name: 'Maria',
      email: '',
      message: 'Muito interessante.',
      createdAt: new Date('2026-07-03T10:00:00.000Z'),
    });

    const { POST } = await import('@/app/api/[section]/[identifier]/comments/route');
    const response = await POST(
      new NextRequest('http://localhost/api/news/noticia-teste/comments', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Maria',
          message: 'Muito interessante.',
        }),
      }),
      { params: Promise.resolve({ section: 'news', identifier: 'noticia-teste' }) }
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      data: {
        contentType: 'news',
        contentId: 'news-1',
        name: 'Maria',
        email: '',
        message: 'Muito interessante.',
      },
    });
  });
});
