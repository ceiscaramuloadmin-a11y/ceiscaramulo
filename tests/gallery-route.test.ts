/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminContextFromRequest = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));
const fileToDataUrl = vi.fn();
const createGalleryMedia = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  appendAuditLog: vi.fn(),
  createGalleryMedia,
  fileToDataUrl,
  jsonError,
  listGalleryMedia: vi.fn(),
  requireAdminContextFromRequest,
  requireAdminFromRequest: vi.fn(),
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
    expect(fileToDataUrl).not.toHaveBeenCalled();
    expect(createGalleryMedia).not.toHaveBeenCalled();
  });
});
