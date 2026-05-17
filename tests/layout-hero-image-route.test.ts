/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const getSiteLayoutSettings = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/app/api/_lib/cms', () => ({
  getSiteLayoutSettings,
  jsonError,
}));

describe('layout hero image route', () => {
  it('serves the stored data-url hero image as a cacheable binary response', async () => {
    getSiteLayoutSettings.mockResolvedValue({
      home: {
        hero: {
          imageUrl: 'data:image/png;base64,aGVsbG8=',
        },
      },
    });

    const { GET } = await import('@/app/api/layout/hero-image/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Vercel-CDN-Cache-Control')).toContain('s-maxage=604800');

    const body = Buffer.from(await response.arrayBuffer()).toString('utf8');
    expect(body).toBe('hello');
  });
});
