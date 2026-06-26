/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requireAdminContextFromRequest = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));
const storeUploadedFile = vi.fn();
const fileToDataUrl = vi.fn();
const createGalleryMedia = vi.fn();
const getGalleryMediaById = vi.fn();
const listGalleryMedia = vi.fn();
const updateGalleryMedia = vi.fn();
const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');

vi.mock('@/app/api/_lib/cms', () => ({
  appendAuditLog: vi.fn(),
  createGalleryMedia,
  fileToDataUrl,
  getGalleryMediaById,
  jsonError,
  listGalleryMedia,
  requireAdminContextFromRequest,
  requireAdminFromRequest: vi.fn(),
  storeUploadedFile,
  updateGalleryMedia,
}));

describe('gallery route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['gallery'] },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects oversized inline audio uploads with 413', async () => {
    const { POST } = await import('@/app/api/gallery/route');
    const formData = new FormData();
    formData.append('title', 'Podcast');
    formData.append('type', 'audio');
    formData.append('published', 'true');
    formData.append('sourceFile', new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'podcast.mp3', { type: 'audio/mpeg' }));

    const request = new Request('http://localhost/api/gallery', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      message: 'Ficheiros de áudio grandes devem ser enviados por URL. Para upload direto, usa um áudio até 4 MB.',
    });
    expect(storeUploadedFile).not.toHaveBeenCalled();
    expect(createGalleryMedia).not.toHaveBeenCalled();
  });

  it('passes the requested gallery context to admin listing', async () => {
    listGalleryMedia.mockResolvedValueOnce([]);

    const { GET } = await import('@/app/api/gallery/route');
    const request = {
      nextUrl: new URL('http://localhost/api/gallery?scope=admin&context=pon-do-jueus'),
    };

    await GET(request as never);

    expect(listGalleryMedia).toHaveBeenCalledWith('admin', 'pon-do-jueus');
  });

  it('stores programme gallery uploads through public storage so sale photos work in production', async () => {
    storeUploadedFile.mockResolvedValueOnce('/uploads/backoffice/gallery-escola-dos-nossos-avos/foto.png');
    createGalleryMedia.mockResolvedValueOnce({
      id: 'media-1',
      title: 'Foto',
      type: 'photo',
      context: 'escola-dos-nossos-avos',
      source: '/uploads/backoffice/gallery-escola-dos-nossos-avos/foto.png',
      published: true,
    });

    const { POST } = await import('@/app/api/gallery/route');
    const formData = new FormData();
    formData.append('title', 'Foto');
    formData.append('type', 'photo');
    formData.append('context', 'escola-dos-nossos-avos');
    formData.append('published', 'true');
    formData.append('sourceFile', new File(['x'], 'foto.png', { type: 'image/png' }));

    const request = new Request('http://localhost/api/gallery', {
      method: 'POST',
      body: formData,
    });

    await POST(request as never);

    expect(createGalleryMedia).toHaveBeenCalledWith(expect.objectContaining({
      context: 'escola-dos-nossos-avos',
      title: 'Foto',
      type: 'photo',
      source: '/uploads/backoffice/gallery-escola-dos-nossos-avos/foto.png',
    }));
    expect(storeUploadedFile).toHaveBeenCalledWith(expect.any(File), 'gallery-escola-dos-nossos-avos');
    expect(fileToDataUrl).not.toHaveBeenCalled();
  });

  it('stores Biblioteca JRS document uploads with the dedicated context', async () => {
    storeUploadedFile.mockResolvedValueOnce('/uploads/backoffice/gallery-biblioteca-jrs/catalogo.pdf');
    createGalleryMedia.mockResolvedValueOnce({
      id: 'jrs-doc-1',
      title: 'Catálogo JRS',
      type: 'document',
      context: 'biblioteca-jrs',
      source: '/uploads/backoffice/gallery-biblioteca-jrs/catalogo.pdf',
      published: true,
    });

    const { POST } = await import('@/app/api/gallery/route');
    const formData = new FormData();
    formData.append('title', 'Catálogo JRS');
    formData.append('type', 'document');
    formData.append('context', 'biblioteca-jrs');
    formData.append('published', 'true');
    formData.append('sourceFile', new File(['pdf'], 'catalogo.pdf', { type: 'application/pdf' }));

    const request = new Request('http://localhost/api/gallery', {
      method: 'POST',
      body: formData,
    });

    await POST(request as never);

    expect(createGalleryMedia).toHaveBeenCalledWith(expect.objectContaining({
      context: 'biblioteca-jrs',
      title: 'Catálogo JRS',
      type: 'document',
      source: '/uploads/backoffice/gallery-biblioteca-jrs/catalogo.pdf',
      mimeType: 'application/pdf',
    }));
    expect(storeUploadedFile).toHaveBeenCalledWith(expect.any(File), 'gallery-biblioteca-jrs');
    expect(fileToDataUrl).not.toHaveBeenCalled();
  });

  it('stores global gallery uploads through public storage', async () => {
    storeUploadedFile.mockResolvedValueOnce('/uploads/backoffice/gallery-global/foto.png');
    createGalleryMedia.mockResolvedValueOnce({
      id: 'media-global',
      title: 'Foto global',
      type: 'photo',
      context: 'global',
      source: '/uploads/backoffice/gallery-global/foto.png',
      published: true,
    });

    const { POST } = await import('@/app/api/gallery/route');
    const formData = new FormData();
    formData.append('title', 'Foto global');
    formData.append('type', 'photo');
    formData.append('published', 'true');
    formData.append('sourceFile', new File(['x'], 'foto.png', { type: 'image/png' }));

    const request = new Request('http://localhost/api/gallery', {
      method: 'POST',
      body: formData,
    });

    await POST(request as never);

    expect(createGalleryMedia).toHaveBeenCalledWith(expect.objectContaining({
      context: 'global',
      source: '/uploads/backoffice/gallery-global/foto.png',
    }));
    expect(storeUploadedFile).toHaveBeenCalledWith(expect.any(File), 'gallery-global');
    expect(fileToDataUrl).not.toHaveBeenCalled();
  });

  it('stores programme gallery replacement uploads through public storage', async () => {
    getGalleryMediaById.mockResolvedValueOnce({
      id: 'pon-1',
      title: 'Foto antiga',
      description: null,
      type: 'photo',
      context: 'pon-do-jueus',
      source: 'data:image/png;base64,old',
      thumbnail: null,
      mimeType: 'image/png',
      published: true,
    });
    storeUploadedFile.mockResolvedValueOnce('/uploads/backoffice/gallery-pon-do-jueus/foto-nova.png');
    updateGalleryMedia.mockResolvedValueOnce({
      id: 'pon-1',
      title: 'Foto nova',
      type: 'photo',
      context: 'pon-do-jueus',
      source: '/uploads/backoffice/gallery-pon-do-jueus/foto-nova.png',
      published: true,
    });

    const { PUT } = await import('@/app/api/gallery/[id]/route');
    const formData = new FormData();
    formData.append('title', 'Foto nova');
    formData.append('type', 'photo');
    formData.append('context', 'pon-do-jueus');
    formData.append('published', 'true');
    formData.append('sourceFile', new File(['x'], 'foto.png', { type: 'image/png' }));

    const request = new Request('http://localhost/api/gallery/pon-1', {
      method: 'PUT',
      body: formData,
    });

    await PUT(request as never, { params: Promise.resolve({ id: 'pon-1' }) });

    expect(updateGalleryMedia).toHaveBeenCalledWith('pon-1', expect.objectContaining({
      context: 'pon-do-jueus',
      source: '/uploads/backoffice/gallery-pon-do-jueus/foto-nova.png',
    }));
    expect(storeUploadedFile).toHaveBeenCalledWith(expect.any(File), 'gallery-pon-do-jueus');
    expect(fileToDataUrl).not.toHaveBeenCalled();
  });

  it('allows creating gallery media without a source URL or uploaded file', async () => {
    createGalleryMedia.mockResolvedValueOnce({
      id: 'media-empty-source',
      title: 'Registo sem origem',
      type: 'photo',
      context: 'global',
      source: '',
      published: true,
    });

    const { POST } = await import('@/app/api/gallery/route');
    const formData = new FormData();
    formData.append('title', 'Registo sem origem');
    formData.append('type', 'photo');
    formData.append('published', 'true');

    const request = new Request('http://localhost/api/gallery', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as never);

    expect(response.status).toBe(201);
    expect(jsonError).not.toHaveBeenCalledWith('Origem do media é obrigatória.', 400);
    expect(createGalleryMedia).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Registo sem origem',
      source: '',
    }));
  });

  it('keeps stored gallery records even when they do not have a source yet', () => {
    expect(cmsSource).not.toContain('if (!source) {\n    return null;\n  }');
    expect(cmsSource).toContain('source,');
  });
});
