import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  appendAuditLog,
  findContent,
  getSectionPermission,
  getSectionModel,
  hasAdminPermission,
  isContentSection,
  jsonError,
  parseSectionFormData,
  requireAdminContextFromRequest,
} from '@/app/api/_lib/cms';
import { enqueueNewsPublishedNotifications } from '@/lib/newsletter-on-publish';

// Estas rotas cobrem operações por item:
// - GET: detalhe público (ou admin com `scope=admin`)
// - PUT: atualização de registo (apenas admin)
// - DELETE: remoção de registo + comentários associados (apenas admin)
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; identifier: string }> }
) {
  try {
    const { section, identifier } = await params;

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

    const item = await findContent(section, identifier, scope);

    if (!item) {
      return jsonError('Registo não encontrado.', 404);
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; identifier: string }> }
) {
  const { context, error: authError } = await requireAdminContextFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { section, identifier } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
      return jsonError('Sem permissão para gerir esta secção.', 403);
    }

    const model = getSectionModel(section);
    const currentItem = await model.findUnique({ where: { id: identifier } });

    if (!currentItem) {
      return jsonError('Registo não encontrado.', 404);
    }

    const formData = await request.formData();
    const data = await parseSectionFormData(section, formData, currentItem);

    const updated = await model.update({
      where: { id: identifier },
      data,
    });

    const beforeNews = currentItem as { slug?: string; title?: string; excerpt?: string; published?: boolean };
    const prevPublished =
      typeof beforeNews.published === 'boolean' ? beforeNews.published : null;

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'update',
        targetType: section,
        targetId: identifier,
        summary: `Atualização de registo na secção ${section}.`,
        before: currentItem,
        after: updated as Record<string, unknown>,
      });
    }

    if (section === 'news') {
      const next = updated as { slug?: string; title?: string; excerpt?: string; published?: boolean };
      if (
        next.slug &&
        next.title &&
        next.excerpt !== undefined &&
        typeof next.published === 'boolean'
      ) {
        await enqueueNewsPublishedNotifications(prevPublished, {
          slug: next.slug,
          title: next.title,
          excerpt: next.excerpt,
          published: next.published,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ section: string; identifier: string }> }
) {
  const { context, error: authError } = await requireAdminContextFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { section, identifier } = await params;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
      return jsonError('Sem permissão para gerir esta secção.', 403);
    }

    const model = getSectionModel(section);
    const currentItem = await model.findUnique({ where: { id: identifier } });

    if (!currentItem) {
      return jsonError('Registo não encontrado.', 404);
    }

    await prisma.contentComment.deleteMany({
      where: {
        contentType: section,
        contentId: currentItem.id,
      },
    });

    await model.delete({ where: { id: identifier } });

    if (context) {
      await appendAuditLog({
        actor: context,
        action: 'delete',
        targetType: section,
        targetId: identifier,
        summary: `Remoção de registo na secção ${section}.`,
        before: currentItem,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', 500);
  }
}
