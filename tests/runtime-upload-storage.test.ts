/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { siteSettingFindUnique, siteSettingUpsert } = vi.hoisted(() => ({
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
}));

const { blobPut } = vi.hoisted(() => ({
  blobPut: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    siteSetting: {
      findUnique: siteSettingFindUnique,
      upsert: siteSettingUpsert,
    },
  },
}));

vi.mock('@vercel/blob', () => ({
  put: blobPut,
}));

describe('runtime upload storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    siteSettingUpsert.mockResolvedValue({});
    blobPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/backoffice/news-fotos/foto.png' });
  });

  it('stores uploads in site settings instead of writing to public at runtime', async () => {
    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-fotos\/.+\.png$/);
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/),
        value: 'data:image/png;base64,aGVsbG8=',
      },
      update: { value: 'data:image/png;base64,aGVsbG8=' },
    });
  });

  it('stores public content cover images as short URLs so saving records and audit logs stays lightweight', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['cover'], 'capa.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'news');

    expect(url).toBe('https://blob.vercel-storage.com/backoffice/news-fotos/foto.png');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news\/.+\.png$/),
      Buffer.from('cover'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('stores uploads in Vercel Blob when the production token is configured', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toBe('https://blob.vercel-storage.com/backoffice/news-fotos/foto.png');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('stores uploads with Vercel OIDC when no read-write token is injected', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.VERCEL_OIDC_TOKEN = 'oidc-token';
    process.env.VERCEL = '1';

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toBe('https://blob.vercel-storage.com/backoffice/news-fotos/foto.png');
    expect(blobPut).toHaveBeenCalledWith(
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        oidcToken: 'oidc-token',
      }
    );
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('stores a database image backup when a private Blob store blocks public access', async () => {
    process.env.BLOB_STORE_ID = 'store-id';
    process.env.BLOB_READ_WRITE_TOKEN = 'token';
    blobPut
      .mockRejectedValueOnce(new Error('Vercel Blob: Cannot use public access on a private store.'))
      .mockResolvedValueOnce({ url: 'https://private.blob.vercel-storage.com/backoffice/news-fotos/foto.png' });

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-fotos\/.+\.png$/);
    expect(blobPut).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^backoffice\/news-fotos\/.+\.png$/),
      Buffer.from('hello'),
      {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'image/png',
        storeId: 'store-id',
        token: 'token',
      }
    );
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/),
        value: 'data:image/png;base64,aGVsbG8=',
      },
      update: { value: 'data:image/png;base64,aGVsbG8=' },
    });
  });

  it('uses the localhost-compatible database image backup when hosted Blob credentials are missing', async () => {
    process.env.VERCEL = '1';
    blobPut.mockRejectedValueOnce(new Error('Vercel Blob: No blob credentials found.'));

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['hello'], 'foto.png', { type: 'image/png' });

    const url = await storeUploadedFile(file, 'News Fotos');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-fotos\/.+\.png$/);
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:news-fotos\/.+\.png$/),
        value: 'data:image/png;base64,aGVsbG8=',
      },
      update: { value: 'data:image/png;base64,aGVsbG8=' },
    });
  });

  it('keeps non-image hosted uploads on the existing local fallback when Blob credentials are missing', async () => {
    process.env.VERCEL = '1';
    blobPut.mockRejectedValueOnce(new Error('Vercel Blob: No blob credentials found.'));

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' });

    const url = await storeUploadedFile(file, 'News Audio');

    expect(url).toMatch(/^\/uploads\/backoffice\/news-audio\/.+\.mp3$/);
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:news-audio\/.+\.mp3$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:news-audio\/.+\.mp3$/),
        value: 'data:audio/mpeg;base64,YXVkaW8=',
      },
      update: { value: 'data:audio/mpeg;base64,YXVkaW8=' },
    });
  });

  it('falls back to database-backed uploads when Vercel Blob reports a missing token with another message', async () => {
    process.env.VERCEL = '1';
    blobPut.mockRejectedValueOnce(new Error('Vercel Blob: Missing token. Set BLOB_READ_WRITE_TOKEN to upload files.'));

    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['pdf'], 'catalogo.pdf', { type: 'application/pdf' });

    const url = await storeUploadedFile(file, 'gallery-biblioteca');

    expect(url).toMatch(/^\/uploads\/backoffice\/gallery-biblioteca\/.+\.pdf$/);
    expect(siteSettingUpsert).toHaveBeenCalledWith({
      where: { key: expect.stringMatching(/^upload:backoffice:gallery-biblioteca\/.+\.pdf$/) },
      create: {
        key: expect.stringMatching(/^upload:backoffice:gallery-biblioteca\/.+\.pdf$/),
        value: 'data:application/pdf;base64,cGRm',
      },
      update: { value: 'data:application/pdf;base64,cGRm' },
    });
  });

  it('rejects HEIC uploads before saving unusable public cover image URLs', async () => {
    const { storeUploadedFile } = await import('@/app/api/_lib/cms');
    const file = new File(['heic'], 'capa.heic', { type: 'image/heic' });

    await expect(storeUploadedFile(file, 'activities')).rejects.toThrow(
      'Usa uma imagem em JPG, PNG, WebP ou GIF para garantir compatibilidade no site.'
    );
    expect(blobPut).not.toHaveBeenCalled();
    expect(siteSettingUpsert).not.toHaveBeenCalled();
  });

  it('reads private Blob markers from upload metadata', async () => {
    const { getStoredUploadedFile } = await import('@/app/api/_lib/cms');
    siteSettingFindUnique.mockResolvedValueOnce({ value: 'blob-private:news/file.png' });

    await expect(getStoredUploadedFile(['news', 'file.png'])).resolves.toBe('blob-private:news/file.png');
    expect(siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: 'upload:backoffice:news/file.png' },
    });
  });

  it('reads only normalized backoffice upload paths', async () => {
    const { getStoredUploadedFile } = await import('@/app/api/_lib/cms');
    siteSettingFindUnique.mockResolvedValueOnce({ value: 'data:text/plain;base64,b2s=' });

    await expect(getStoredUploadedFile(['news', 'file.txt'])).resolves.toBe('data:text/plain;base64,b2s=');
    expect(siteSettingFindUnique).toHaveBeenCalledWith({
      where: { key: 'upload:backoffice:news/file.txt' },
    });

    await expect(getStoredUploadedFile(['..', 'secret.txt'])).resolves.toBeNull();
  });
});
