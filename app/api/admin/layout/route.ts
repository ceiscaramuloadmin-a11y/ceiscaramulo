import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  fileToDataUrl,
  getSiteLayoutSettings,
  hasAdminPermission,
  jsonError,
  requireAdminContextFromRequest,
  saveSiteLayoutSettings,
} from '@/app/api/_lib/cms';
import { deepMergeSettings, defaultSiteLayoutSettings } from '@/lib/site-layout';
import type { SiteLayoutSettings } from '@/types';

export const runtime = 'nodejs';

// Endpoint administrativo para leitura das definições completas do layout.
export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'layout')) {
    return jsonError('Sem permissão para gerir o layout.', 403);
  }

  try {
    const settings = await getSiteLayoutSettings();
    return NextResponse.json(settings);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

// Endpoint administrativo para atualização das definições de layout com auditoria.
export async function PUT(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'layout')) {
    return jsonError('Sem permissão para gerir o layout.', 403);
  }

  try {
    const current = await getSiteLayoutSettings();
    const contentType = request.headers.get('content-type') || '';
    let payload: unknown = {};
    let heroImageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawSettings = formData.get('settings');

      if (typeof rawSettings === 'string') {
        payload = JSON.parse(rawSettings);
      }

      const rawFile = formData.get('heroImage');
      heroImageFile = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
    } else {
      payload = await request.json().catch(() => ({}));
    }

    const merged = deepMergeSettings(defaultSiteLayoutSettings, payload) as SiteLayoutSettings;

    if (heroImageFile) {
      merged.home.hero.imageUrl = await fileToDataUrl(heroImageFile);
    }

    await saveSiteLayoutSettings(merged);

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'layout_update',
        targetType: 'site_layout',
        targetId: 'global',
        summary: 'Atualização das definições de layout do site.',
        before: current,
        after: merged,
      });
    }

    return NextResponse.json(merged);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
