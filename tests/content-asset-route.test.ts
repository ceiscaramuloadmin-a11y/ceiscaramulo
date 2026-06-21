/* @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const newsFindFirst = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    news: {
      findFirst: newsFindFirst,
    },
    activity: {
      findFirst: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
    publication: {
      findFirst: vi.fn(),
    },
  },
}));

describe('public content asset route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves legacy inline cover images as media responses', async () => {
    newsFindFirst.mockResolvedValueOnce({
      image: 'data:image/png;base64,aGVsbG8=',
    });

    const { GET } = await import('@/app/api/content-assets/[section]/[id]/route');
    const response = await GET(new Request('http://localhost/api/content-assets/news/n1'), {
      params: Promise.resolve({ section: 'news', id: 'n1' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    await expect(response.text()).resolves.toBe('hello');
  });

  it('returns 404 instead of 500 when the content asset lookup fails', async () => {
    newsFindFirst.mockRejectedValueOnce(new Error('database unavailable'));

    const { GET } = await import('@/app/api/content-assets/[section]/[id]/route');
    const response = await GET(new Request('http://localhost/api/content-assets/news/n1'), {
      params: Promise.resolve({ section: 'news', id: 'n1' }),
    });

    expect(response.status).toBe(404);
    expect(console.error).toHaveBeenCalledWith('Unable to serve public content asset.', expect.any(Error));
  });

  it('returns 404 instead of 400 for invalid inline cover metadata', async () => {
    newsFindFirst.mockResolvedValueOnce({
      image: 'data:image/png;base64,',
    });

    const { GET } = await import('@/app/api/content-assets/[section]/[id]/route');
    const response = await GET(new Request('http://localhost/api/content-assets/news/n1'), {
      params: Promise.resolve({ section: 'news', id: 'n1' }),
    });

    expect(response.status).toBe(404);
    expect(console.warn).toHaveBeenCalledWith('Invalid public content asset for news/n1.');
  });
});
