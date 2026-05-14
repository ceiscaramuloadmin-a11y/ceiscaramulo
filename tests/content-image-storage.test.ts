/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const adminLayoutSource = readFileSync(resolve(process.cwd(), 'app/api/admin/layout/route.ts'), 'utf8');
const siteLayoutSource = readFileSync(resolve(process.cwd(), 'lib/site-layout.ts'), 'utf8');

describe('content image storage', () => {
  it('converts uploaded content images to base64 data URLs before persisting them', () => {
    expect(cmsSource).toContain('const resolvedAsset = file ? await fileToDataUrl(file)');
    expect(cmsSource).toContain('image: resolvedAsset');
    expect(cmsSource).toContain('coverImage: resolvedAsset');
  });

  it('converts uploaded layout hero images to base64 data URLs before saving settings', () => {
    expect(adminLayoutSource).toContain('normalizeHeroImageValue');
    expect(adminLayoutSource).toContain("return normalized.startsWith('data:') ? normalized : '';");
    expect(adminLayoutSource).toContain('merged.home.hero.imageUrl = await fileToDataUrl(heroImageFile);');
  });

  it('does not keep a static project path as the default hero image source', () => {
    expect(siteLayoutSource).toMatch(/imageUrl:\s*'\/og-image\.svg\|\/placeholder\.svg'/);
    expect(siteLayoutSource).not.toContain("imageUrl: '/hero-serra.jpg'");
  });
});
