/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const nextConfigSource = readFileSync(resolve(process.cwd(), 'next.config.js'), 'utf8');
const homeHeroSource = readFileSync(resolve(process.cwd(), 'components/HomeHero.tsx'), 'utf8');
const contentAssetsSource = readFileSync(
  resolve(process.cwd(), 'app/api/content-assets/[section]/[id]/route.ts'),
  'utf8'
);
const sectionRouteSource = readFileSync(resolve(process.cwd(), 'app/api/[section]/route.ts'), 'utf8');
const gallerySource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const cacheHeadersSource = readFileSync(resolve(process.cwd(), 'lib/cache-headers.ts'), 'utf8');

describe('origin transfer optimization', () => {
  it('keeps Next image optimization enabled on Vercel with long optimized image cache', () => {
    expect(nextConfigSource).toContain("formats: ['image/avif', 'image/webp']");
    expect(nextConfigSource).toContain('minimumCacheTTL: 604800');
    expect(nextConfigSource).toContain('unoptimized: isExportBuild');
    expect(nextConfigSource).toContain('max-age=31536000, immutable');
  });

  it('uses resized webp hero slides through next/image instead of full-size jpg img tags', () => {
    expect(homeHeroSource).toContain("import Image from 'next/image'");
    expect(homeHeroSource).toContain("hero-img.webp");
    expect(homeHeroSource).toContain('priority={activeHeroIndex === 0}');
    expect(homeHeroSource).not.toContain("hero-img.jpg'");
    expect(homeHeroSource).not.toContain("hero-img-7710.webp");
    expect(homeHeroSource).not.toContain("hero-img2.webp");
    expect(homeHeroSource).not.toContain("hero-img2.jpg'");
  });

  it('serves inline CMS media through cached public asset routes', () => {
    expect(contentAssetsSource).toContain('parseDataUrl(rawAsset)');
    expect(contentAssetsSource).toContain('PUBLIC_MEDIA_CACHE_HEADERS');
    expect(sectionRouteSource).toContain('withPublicContentAsset');
    expect(sectionRouteSource).toContain('PUBLIC_DATA_CACHE_HEADERS');
  });

  it('keeps public CMS data responses uncached so backoffice edits appear immediately', () => {
    expect(cacheHeadersSource).toContain("'Cache-Control': 'no-store, max-age=0'");
    expect(cacheHeadersSource).toContain("'CDN-Cache-Control': 'no-store'");
    expect(cacheHeadersSource).toContain("'Vercel-CDN-Cache-Control': 'no-store'");
    expect(cacheHeadersSource).toContain('PUBLIC_MEDIA_CACHE_HEADERS');
  });

  it('normalizes public gallery data URLs to cached asset URLs', () => {
    expect(gallerySource).toContain('withPublicGalleryAssets');
    expect(gallerySource).toContain("scope === 'public' ? publicItems.map(withPublicGalleryAssets) : publicItems");
  });
});
