/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPrivateBlobUpload = vi.fn();
const getStoredUploadedFile = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  getStoredUploadedFile,
}));

vi.mock('@/lib/upload-storage', () => ({
  getPrivateBlobUpload,
}));

describe('backoffice uploaded file route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredUploadedFile.mockResolvedValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves old backoffice upload URLs from private Blob storage', async () => {
    getPrivateBlobUpload.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['blob-ok']).stream(),
      blob: {
        contentType: 'image/jpeg',
        size: 7,
      },
    });

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/activities/file.jpg'), {
      params: Promise.resolve({ path: ['activities', 'file.jpg'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Content-Length')).toBe('7');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    await expect(response.text()).resolves.toBe('blob-ok');
    expect(getPrivateBlobUpload).toHaveBeenCalledWith('activities/file.jpg');
  });

  it('serves old database-backed upload metadata before checking Blob storage', async () => {
    getStoredUploadedFile.mockResolvedValueOnce('data:image/png;base64,b2s=');

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/activities/file.png'), {
      params: Promise.resolve({ path: ['activities', 'file.png'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    await expect(response.text()).resolves.toBe('ok');
    expect(getPrivateBlobUpload).not.toHaveBeenCalled();
  });

  it('serves private Blob uploads from old lightweight metadata markers', async () => {
    getStoredUploadedFile.mockResolvedValueOnce('blob-private:activities/file.jpg');
    getPrivateBlobUpload.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['blob-ok']).stream(),
      blob: {
        contentType: 'image/jpeg',
        size: 7,
      },
    });

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/activities/file.jpg'), {
      params: Promise.resolve({ path: ['activities', 'file.jpg'] }),
    });

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('blob-ok');
    expect(getPrivateBlobUpload).toHaveBeenCalledWith('activities/file.jpg');
  });

  it('returns 404 for unsafe upload paths', async () => {
    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/../secret.jpg'), {
      params: Promise.resolve({ path: ['..', 'secret.jpg'] }),
    });

    expect(response.status).toBe(404);
    expect(getPrivateBlobUpload).not.toHaveBeenCalled();
  });

  it('returns 404 when Blob lookup fails', async () => {
    getPrivateBlobUpload.mockRejectedValueOnce(new Error('No blob credentials found.'));

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/activities/file.jpg'), {
      params: Promise.resolve({ path: ['activities', 'file.jpg'] }),
    });

    expect(response.status).toBe(404);
    expect(console.error).toHaveBeenCalledWith(
      'Unable to read uploaded Blob file "activities/file.jpg".',
      expect.any(Error)
    );
  });
});
