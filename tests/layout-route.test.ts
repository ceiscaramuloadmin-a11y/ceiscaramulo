/* @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

const getPublicSiteLayoutSettings = vi.fn();
const jsonError = vi.fn((message: string, status = 400) => Response.json({ message }, { status }));

vi.mock('@/lib/site-layout-settings', () => ({
  getPublicSiteLayoutSettings,
}));

vi.mock('@/app/api/_lib/cms', () => ({
  jsonError,
}));

describe('layout route', () => {
  it('serves layout settings without browser or CDN caching', async () => {
    getPublicSiteLayoutSettings.mockResolvedValue({
      footer: {
        brandDescription:
          'promover o estudo e a investigação nos vários domínios e interesses, designadamente ambiental, geográfico, biológico, geológico, histórico, etnográfico, gastronómico, ..., da Serra do Caramulo',
      },
    });

    const { GET } = await import('@/app/api/layout/route');
    const response = await GET();
    const body = await response.json();

    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(body.footer.brandDescription).toBe(
      'promover o estudo e a investigação nos vários domínios e interesses, designadamente ambiental, geográfico, biológico, geológico, histórico, etnográfico, gastronómico, ..., da Serra do Caramulo'
    );
  });
});
