/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const adminLayoutSource = readFileSync(resolve(process.cwd(), 'app/api/admin/layout/route.ts'), 'utf8');
const siteLayoutSource = readFileSync(resolve(process.cwd(), 'lib/site-layout.ts'), 'utf8');

describe('content image storage', () => {
  it('stores uploaded content images as public upload files before persisting their URLs', () => {
    expect(cmsSource).toContain('export async function storeUploadedFile');
    expect(cmsSource).toContain("const UPLOAD_PUBLIC_ROOT = '/uploads/backoffice'");
    expect(cmsSource).toContain('const resolvedAsset = file ? await storeUploadedFile(file, section)');
    expect(cmsSource).toContain('image: resolvedAsset');
    expect(cmsSource).toContain('coverImage: resolvedAsset');
  });

  it('stores uploaded publication PDFs and keeps using the downloadUrl contract', () => {
    expect(cmsSource).toContain("rawDocument instanceof File && rawDocument.size > 0 && rawDocument.type === 'application/pdf'");
    expect(cmsSource).toContain("storeUploadedFile(documentFile, 'publications-documents')");
    expect(cmsSource).toContain('downloadUrl: resolvedDownloadUrl');
  });

  it('stores uploaded layout hero images as public upload files before saving settings', () => {
    expect(adminLayoutSource).toContain('normalizeHeroImageValue');
    expect(adminLayoutSource).toContain("normalized.startsWith('/uploads/')");
    expect(adminLayoutSource).toContain("merged.home.hero.imageUrl = await storeUploadedFile(heroImageFile, 'layout');");
  });

  it('does not keep a static project path as the default hero image source', () => {
    expect(siteLayoutSource).toMatch(/imageUrl:\s*'\/og-image\.svg\|\/placeholder\.svg'/);
    expect(siteLayoutSource).not.toContain("imageUrl: '/hero-serra.jpg'");
  });
});
