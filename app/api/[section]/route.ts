import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  getSectionModel,
  getSectionPermission,
  hasAdminPermission,
  isContentSection,
  jsonError,
  parseSectionFormData,
  requireAdminContextFromRequest,
  sectionConfig,
} from '@/app/api/_lib/cms';
import { PUBLIC_DATA_CACHE_HEADERS } from '@/lib/cache-headers';
import { enqueueNewsPublishedNotifications } from '@/lib/newsletter-on-publish';
import { withPublicContentAsset, type PublicContentSection } from '@/lib/public-content-assets';

// Estas rotas cobrem operações de coleção por secção:
// - GET: listagem pública (ou admin com `scope=admin`)
// - POST: criação de registos (apenas admin autenticado)
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  try {
    const { section } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    const scope = request.nextUrl.searchParams.get('scope') === 'admin' ? 'admin' : 'public';

    if (scope === 'admin') {
      const { context, error } = await requireAdminContextFromRequest(request);

      if (error) {
        return error;
      }

      if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
        return jsonError('Sem permissão para aceder a esta secção.', 403);
      }
    }

    const config = sectionConfig[section];
    const model = getSectionModel(section);

    const items = await model.findMany({
      where: scope === 'admin' ? {} : config.publicWhere,
      orderBy: config.listOrder,
    });

    if (scope === 'public') {
      const publicItems = items.map((item) =>
        withPublicContentAsset(section as PublicContentSection, item as { id: string })
      );

      return NextResponse.json(publicItems, {
        headers: PUBLIC_DATA_CACHE_HEADERS,
      });
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { context, error: authError } = await requireAdminContextFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { section } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
      return jsonError('Sem permissão para gerir esta secção.', 403);
    }

    const formData = await request.formData();
    const data = await parseSectionFormData(section, formData);
    const model = getSectionModel(section);

    const created = await model.create({ data });

    if (context) {
      const createdRecord = created as { id?: string } & Record<string, unknown>;
      await appendAuditLog({
        actor: context,
        action: 'create',
        targetType: section,
        targetId: createdRecord.id ?? null,
        summary: `Criação de registo na secção ${section}.`,
        after: createdRecord,
      });
    }

    if (section === 'news') {
      const draft = created as { slug?: string; title?: string; excerpt?: string; published?: boolean };
      if (
        draft.slug &&
        draft.title &&
        draft.excerpt !== undefined &&
        typeof draft.published === 'boolean'
      ) {
        await enqueueNewsPublishedNotifications(null, {
          slug: draft.slug,
          title: draft.title,
          excerpt: draft.excerpt,
          published: draft.published,
        });
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', 500);
  }
}
