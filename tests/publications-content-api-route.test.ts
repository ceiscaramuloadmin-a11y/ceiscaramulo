/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  publicationCreate,
  requireAdminContextFromRequest,
  appendAuditLog,
  hasAdminPermission,
  storePublicUpload,
} = vi.hoisted(() => ({
  publicationCreate: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  appendAuditLog: vi.fn(),
  hasAdminPermission: vi.fn(),
  storePublicUpload: vi.fn(),
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

vi.mock('@/lib/upload-storage', () => ({
  storePublicUpload,
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
    storePublicUpload.mockResolvedValue({ publicUrl: 'https://blob.example/backoffice/publications-media/video.mp4' });
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

  it('stores uploaded resource photos, videos or audio as external media URLs', async () => {
    const { POST } = await import('@/app/api/[section]/route');
    const formData = publicationForm();
    formData.set('document', new File(['video'], 'apresentacao.mp4', { type: 'video/mp4' }));

    const response = await POST(
      new NextRequest('http://localhost/api/publications', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ section: 'publications' }) }
    );

    expect(response.status).toBe(201);
    expect(storePublicUpload).toHaveBeenCalledWith(expect.objectContaining({
      relativePath: expect.stringMatching(/^publications-media\/.+\.mp4$/),
      contentType: 'video/mp4',
    }));
    expect(publicationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        downloadUrl: 'https://blob.example/backoffice/publications-media/video.mp4',
      }),
    });
  });

  it('rejects unsupported resource attachment formats as validation errors', async () => {
    const { POST } = await import('@/app/api/[section]/route');
    const formData = publicationForm();
    formData.set('document', new File(['bad'], 'ficheiro.exe', { type: 'application/x-msdownload' }));

    const response = await POST(
      new NextRequest('http://localhost/api/publications', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ section: 'publications' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Usa um PDF, imagem, vídeo ou áudio compatível para o ficheiro do recurso.',
    });
    expect(publicationCreate).not.toHaveBeenCalled();
  });
});
