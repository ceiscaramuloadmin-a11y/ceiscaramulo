/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const adminLayoutSource = readFileSync(resolve(process.cwd(), 'app/api/admin/layout/route.ts'), 'utf8');
const siteLayoutSource = readFileSync(resolve(process.cwd(), 'lib/site-layout.ts'), 'utf8');

describe('content image storage', () => {
  it('stores uploaded content images through public storage before persisting short URLs', () => {
    expect(cmsSource).toContain('export async function storeUploadedFile');
    expect(cmsSource).toContain("const UPLOAD_PUBLIC_ROOT = '/uploads/backoffice'");
    expect(cmsSource).toContain("const UPLOAD_STORAGE_KEY_PREFIX = 'upload:backoffice:'");
    expect(cmsSource).toContain("import { storePublicUpload } from '@/lib/upload-storage';");
    expect(cmsSource).toContain('const publicUpload = await storePublicUpload({ relativePath, buffer, contentType: mimeType });');
    expect(cmsSource).toContain('if (publicUpload.storageValue)');
    expect(cmsSource).toContain('return publicUpload.publicUrl;');
    expect(cmsSource).not.toContain('function shouldInlineContentCoverUpload');
    expect(cmsSource).toContain('setSiteSettingValue(`${UPLOAD_STORAGE_KEY_PREFIX}${relativePath}`, dataUrl)');
    expect(cmsSource).not.toContain("join(process.cwd(), 'public'");
    expect(cmsSource).not.toContain('await mkdir(');
    expect(cmsSource).not.toContain('await writeFile(');
    expect(cmsSource).toContain('const resolvedAsset = file ? await storeUploadedFile(file, section)');
    expect(cmsSource).toContain('image: resolvedAsset');
    expect(cmsSource).toContain('coverImage: resolvedAsset');
  });

  it('blocks browser-incompatible HEIC cover images before they are persisted', () => {
    expect(cmsSource).toContain('function isUnsupportedBrowserImage');
    expect(cmsSource).toContain("normalizedMimeType === 'image/heic'");
    expect(cmsSource).toContain("normalizedExtension === '.heic'");
    expect(cmsSource).toContain('Usa uma imagem em JPG, PNG, WebP ou GIF');
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
