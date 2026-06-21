/* @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { publicAssetValue, withPublicContentAsset } from '@/lib/public-content-assets';

describe('public content asset URLs', () => {
  it('serves Vercel Blob backoffice covers through the local uploads route', () => {
    expect(
      publicAssetValue(
        'news',
        'n1',
        'https://abc123.blob.vercel-storage.com/backoffice/news/capa.png'
      )
    ).toBe('/uploads/backoffice/news/capa.png');
  });

  it('keeps legacy inline cover images behind the content asset route', () => {
    expect(publicAssetValue('news', 'n1', 'data:image/png;base64,aGVsbG8=')).toBe(
      '/api/content-assets/news/n1'
    );
  });

  it('serves legacy filename-only activity covers through the local uploads route', () => {
    expect(
      publicAssetValue('activities', 'a1', '1781821868406-5a2e5355-47d8-48cc-b87f-0a3e9925bc22.jpg')
    ).toBe('/uploads/backoffice/activities/1781821868406-5a2e5355-47d8-48cc-b87f-0a3e9925bc22.jpg');
  });

  it('keeps unrelated external images unchanged', () => {
    expect(publicAssetValue('news', 'n1', 'https://cdn.example.com/capa.png')).toBe(
      'https://cdn.example.com/capa.png'
    );
  });

  it('normalizes model records before public pages render their cover image', () => {
    expect(
      withPublicContentAsset('publications', {
        id: 'p1',
        coverImage: 'https://abc123.blob.vercel-storage.com/backoffice/publications/capa.webp',
      }).coverImage
    ).toBe('/uploads/backoffice/publications/capa.webp');
  });
});
