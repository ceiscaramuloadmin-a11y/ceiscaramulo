/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const nextConfigSource = readFileSync(resolve(process.cwd(), 'next.config.js'), 'utf8');
const homeHeroSource = readFileSync(resolve(process.cwd(), 'components/HomeHero.tsx'), 'utf8');
const institutionalProgrammePageSource = readFileSync(resolve(process.cwd(), 'components/InstitutionalProgrammePage.tsx'), 'utf8');
const bibliotecaPageSource = readFileSync(resolve(process.cwd(), 'app/biblioteca/page.tsx'), 'utf8');
const bibliotecaDetailSource = readFileSync(resolve(process.cwd(), 'app/biblioteca/[id]/page.tsx'), 'utf8');
const sobreNosSource = readFileSync(resolve(process.cwd(), 'app/sobre-nos/page.tsx'), 'utf8');
const contentAssetsSource = readFileSync(
  resolve(process.cwd(), 'app/api/content-assets/[section]/[id]/route.ts'),
  'utf8'
);
const sectionRouteSource = readFileSync(resolve(process.cwd(), 'app/api/[section]/route.ts'), 'utf8');
const gallerySource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const galleryTabsSource = readFileSync(resolve(process.cwd(), 'components/GalleryTabs.tsx'), 'utf8');
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
    expect(gallerySource).toContain(
      "contextItems.filter((item) => item.published).map(withPublicGalleryAssets)"
    );
  });

  it('renders static internal page heroes through next/image instead of full-size CSS backgrounds', () => {
    expect(institutionalProgrammePageSource).toContain("import Image from 'next/image'");
    expect(institutionalProgrammePageSource).toContain('src={heroImage}');
    expect(institutionalProgrammePageSource).toContain('sizes="100vw"');
    expect(institutionalProgrammePageSource).not.toContain('backgroundImage');
    expect(bibliotecaPageSource).toContain('src={bibliotecaHeroImage}');
    expect(sobreNosSource).toContain('src={aboutHeroImage}');
  });

  it('serves static gallery grid photos as optimized thumbnails but bypasses dynamic upload routes', () => {
    expect(galleryTabsSource).toContain("import Image from 'next/image'");
    expect(galleryTabsSource).toContain("previewSource.startsWith('/') && !shouldBypassNextImageOptimization(previewSource)");
    expect(galleryTabsSource).toContain('sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"');
    expect(galleryTabsSource).toContain('preload="none"');
  });

  it('optimizes static publication covers while bypassing dynamic backoffice upload routes', () => {
    expect(bibliotecaPageSource).toContain('function OptimizedPublicationCover');
    expect(bibliotecaPageSource).toContain("import Image from 'next/image'");
    expect(bibliotecaPageSource).toContain('shouldBypassNextImageOptimization(src)');
    expect(bibliotecaPageSource).toContain('sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"');
    expect(bibliotecaDetailSource).toContain('function OptimizedPublicationDetailCover');
    expect(bibliotecaDetailSource).toContain('shouldBypassNextImageOptimization(src)');
    expect(bibliotecaDetailSource).toContain('sizes="(min-width: 1024px) 960px, 100vw"');
  });
});
