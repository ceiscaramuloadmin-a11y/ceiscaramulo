/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { siteSettingFindUnique, siteSettingUpsert } = vi.hoisted(() => ({
  siteSettingFindUnique: vi.fn(),
  siteSettingUpsert: vi.fn(),
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

describe('runtime upload storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteSettingUpsert.mockResolvedValue({});
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

