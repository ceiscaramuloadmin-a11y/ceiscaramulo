/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getStoredUploadedFile = vi.fn();
const getPrivateBlobUpload = vi.fn();

vi.mock('@/app/api/_lib/cms', () => ({
  getStoredUploadedFile,
}));

vi.mock('@/lib/upload-storage', () => ({
  getPrivateBlobUpload,
}));

describe('backoffice uploaded file route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves database-backed uploads through the legacy /uploads/backoffice URL', async () => {
    getStoredUploadedFile.mockResolvedValueOnce('data:text/plain;base64,b2s=');

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/file.txt'), {
      params: Promise.resolve({ path: ['news', 'file.txt'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    await expect(response.text()).resolves.toBe('ok');
    expect(getStoredUploadedFile).toHaveBeenCalledWith(['news', 'file.txt']);
  });

  it('serves private Blob uploads through the same public backoffice upload URL', async () => {
    getStoredUploadedFile.mockResolvedValueOnce(null);
    getPrivateBlobUpload.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['blob-ok']).stream(),
      blob: {
        contentType: 'image/png',
        size: 7,
      },
    });

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/file.png'), {
      params: Promise.resolve({ path: ['news', 'file.png'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Content-Length')).toBe('7');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    await expect(response.text()).resolves.toBe('blob-ok');
    expect(getPrivateBlobUpload).toHaveBeenCalledWith('news/file.png');
  });

  it('falls back to Blob lookup when upload metadata lookup fails', async () => {
    getStoredUploadedFile.mockRejectedValueOnce(new Error('database unavailable'));
    getPrivateBlobUpload.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['blob-ok']).stream(),
      blob: {
        contentType: 'image/png',
        size: 7,
      },
    });

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/file.png'), {
      params: Promise.resolve({ path: ['news', 'file.png'] }),
    });

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('blob-ok');
    expect(console.error).toHaveBeenCalledWith('Unable to read uploaded file metadata.', expect.any(Error));
    expect(getPrivateBlobUpload).toHaveBeenCalledWith('news/file.png');
  });

  it('serves private Blob uploads using lightweight stored metadata', async () => {
    getStoredUploadedFile.mockResolvedValueOnce('blob-private:news/file.png');
    getPrivateBlobUpload.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Blob(['blob-ok']).stream(),
      blob: {
        contentType: 'image/png',
        size: 7,
      },
    });

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/file.png'), {
      params: Promise.resolve({ path: ['news', 'file.png'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    await expect(response.text()).resolves.toBe('blob-ok');
    expect(getPrivateBlobUpload).toHaveBeenCalledWith('news/file.png');
  });

  it('returns 404 when an upload URL has no stored file', async () => {
    getStoredUploadedFile.mockResolvedValueOnce(null);
    getPrivateBlobUpload.mockResolvedValueOnce(null);

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/missing.txt'), {
      params: Promise.resolve({ path: ['news', 'missing.txt'] }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 404 instead of crashing when private Blob lookup fails', async () => {
    getStoredUploadedFile.mockResolvedValueOnce(null);
    getPrivateBlobUpload.mockRejectedValueOnce(new Error('No blob credentials found.'));

    const { GET } = await import('@/app/uploads/backoffice/[...path]/route');
    const response = await GET(new Request('http://localhost/uploads/backoffice/news/file.png'), {
      params: Promise.resolve({ path: ['news', 'file.png'] }),
    });

    expect(response.status).toBe(404);
    expect(console.error).toHaveBeenCalledWith(
      'Unable to read uploaded Blob file "news/file.png".',
      expect.any(Error)
    );
  });
});
