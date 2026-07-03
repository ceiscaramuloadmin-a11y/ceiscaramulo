import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  getSectionModel,
  getSectionPermission,
  hasAdminPermission,
  isContentSection,
  jsonError,
  requireAdminContextFromRequest,
} from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const REORDERABLE_SECTIONS = new Set(['news', 'activities']);
const MAX_REORDER_ITEMS = 150;

export async function POST(request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { context, error: authError } = await requireAdminContextFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { section } = await params;

    if (!isContentSection(section) || !REORDERABLE_SECTIONS.has(section)) {
      return jsonError('Secção inválida para ordenação manual.', 404);
    }

    if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
      return jsonError('Sem permissão para ordenar esta secção.', 403);
    }

    const body = (await request.json().catch(() => null)) as { items?: Array<{ id?: unknown; sortOrder?: unknown }> } | null;
    const items = Array.isArray(body?.items) ? body.items.slice(0, MAX_REORDER_ITEMS) : [];

    if (items.length === 0) {
      return jsonError('Indique pelo menos um registo para ordenar.', 400);
    }

    const model = getSectionModel(section);
    const normalizedItems = items
      .map((item, index) => ({
        id: String(item.id || '').trim(),
        sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      }))
      .filter((item) => item.id);

    if (normalizedItems.length !== items.length) {
      return jsonError('A lista de ordenação contém registos inválidos.', 400);
    }

    await Promise.all(
      normalizedItems.map((item) =>
        model.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    await appendAuditLog({
      actor: context,
      action: 'reorder',
      targetType: section,
      targetId: null,
      summary: `Ordenação manual atualizada na secção ${section}.`,
      after: { items: normalizedItems },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', 500);
  }
}
