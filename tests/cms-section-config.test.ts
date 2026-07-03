/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const cmsSource = readFileSync(resolve(process.cwd(), 'app/api/_lib/cms.ts'), 'utf8');
const sectionRouteSource = readFileSync(resolve(process.cwd(), 'app/api/[section]/route.ts'), 'utf8');
const galleryRouteSource = readFileSync(resolve(process.cwd(), 'app/api/gallery/route.ts'), 'utf8');
const contactMessagesRouteSource = readFileSync(resolve(process.cwd(), 'app/api/admin/contact-messages/route.ts'), 'utf8');
const auditRouteSource = readFileSync(resolve(process.cwd(), 'app/api/admin/audit/route.ts'), 'utf8');

describe('cms section configuration', () => {
  it('orders news by editorial publication date before technical creation date', () => {
    expect(cmsSource).toContain("listOrder: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]");
  });

  it('orders activities chronologically from newest event date to oldest', () => {
    expect(cmsSource).toContain("listOrder: [{ date: 'desc' }, { createdAt: 'desc' }]");
  });

  it('bounds heavy admin listings so the backoffice does not pull unbounded database rows', () => {
    expect(sectionRouteSource).toContain('const DEFAULT_ADMIN_LIST_LIMIT = 80');
    expect(sectionRouteSource).toContain("request.nextUrl.searchParams.get('limit')");
    expect(sectionRouteSource).toContain('...(adminLimit ? { take: adminLimit } : {})');
    expect(contactMessagesRouteSource).toContain('const DEFAULT_CONTACT_MESSAGES_LIMIT = 80');
    expect(contactMessagesRouteSource).toContain('take: limit');
    expect(auditRouteSource).toContain('const DEFAULT_ADMIN_AUDIT_LIMIT = 100');
    expect(auditRouteSource).toContain("listAuditLogs(parseAuditLimit(url.searchParams.get('limit')))");
    expect(galleryRouteSource).toContain('const DEFAULT_ADMIN_GALLERY_LIMIT = 120');
    expect(galleryRouteSource).toContain('const items = await listGalleryMedia(scope, context, limit)');
    expect(cmsSource).toContain("findMany: (args: { where: Record<string, unknown>; orderBy: SectionConfig['listOrder']; take?: number })");
    expect(cmsSource).toContain("export async function listGalleryMedia(scope: 'public' | 'admin', context = DEFAULT_GALLERY_CONTEXT, limit?: number)");
  });
});
