import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission, requireAdminContextFromRequest } from '@/app/api/_lib/cms';
import { createCloudinaryUploadSignature } from '@/lib/cloudinary-storage';

export const runtime = 'nodejs';

function normalizeRelativePath(value: unknown) {
  const normalized = String(value || '').trim().replace(/^\/+/, '');

  if (!normalized || normalized.includes('..') || !/^[a-z0-9-]+\/[a-z0-9._/-]+$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const { context, error } = await requireAdminContextFromRequest(request);

    if (error) {
      return error;
    }

    if (!context || !hasAdminPermission(context, 'gallery')) {
      return NextResponse.json({ message: 'Sem permissao para carregar media da galeria.' }, { status: 403 });
    }

    const body = (await request.json()) as { relativePath?: unknown };
    const relativePath = normalizeRelativePath(body.relativePath);

    if (!relativePath) {
      return NextResponse.json({ message: 'Caminho de upload invalido.' }, { status: 400 });
    }

    return NextResponse.json(createCloudinaryUploadSignature({ relativePath }));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Nao foi possivel preparar o upload da galeria.' },
      { status: 400 }
    );
  }
}
