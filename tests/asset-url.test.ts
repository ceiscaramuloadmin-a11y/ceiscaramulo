/* @vitest-environment node */

import { afterEach, describe, expect, it } from 'vitest';
import { getAssetUrl, shouldBypassNextImageOptimization } from '@/lib/utils';

describe('getAssetUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it('keeps backoffice upload URLs on the same origin when no API base URL is configured', () => {
    expect(getAssetUrl('/uploads/backoffice/news/foto.png')).toBe('/uploads/backoffice/news/foto.png');
  });

  it('keeps backoffice upload URLs on the same origin even when an API base URL is configured', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.ceiscaramulo.pt/';

    expect(getAssetUrl('/uploads/backoffice/news/foto.png')).toBe('/uploads/backoffice/news/foto.png');
  });

  it('normalizes backoffice upload URLs that were saved without a leading slash', () => {
    expect(getAssetUrl('uploads/backoffice/rich-text-activities-image/foto.jpg')).toBe(
      '/uploads/backoffice/rich-text-activities-image/foto.jpg'
    );
  });

  it('marks dynamic public asset routes as unsafe for next/image optimization', () => {
    expect(shouldBypassNextImageOptimization('/uploads/backoffice/news/foto.png')).toBe(true);
    expect(shouldBypassNextImageOptimization('/api/content-assets/news/n1')).toBe(true);
    expect(shouldBypassNextImageOptimization('/api/gallery/assets/g1/source')).toBe(true);
    expect(shouldBypassNextImageOptimization('/internal-pages/pon-do-jueus.jpg')).toBe(false);
    expect(shouldBypassNextImageOptimization('https://blob.example/foto.jpg')).toBe(false);
  });
});
