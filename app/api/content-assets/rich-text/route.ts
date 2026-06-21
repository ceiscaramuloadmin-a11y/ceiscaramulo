import { NextRequest, NextResponse } from 'next/server';
import {
  getSectionPermission,
  hasAdminPermission,
  isContentSection,
  jsonError,
  fileToDataUrl,
  requireAdminContextFromRequest,
  storeUploadedFile,
} from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const ACCEPTED_MEDIA = {
  image: 'image/',
  audio: 'audio/',
  video: 'video/',
} as const;

const INLINE_RICH_TEXT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type RichTextMediaKind = keyof typeof ACCEPTED_MEDIA;

function isRichTextMediaKind(value: unknown): value is RichTextMediaKind {
  return typeof value === 'string' && value in ACCEPTED_MEDIA;
}

export async function POST(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  try {
    const formData = await request.formData();
    const section = String(formData.get('section') || '');
    const kind = formData.get('kind');
    const rawFile = formData.get('file');
    const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

    if (!isContentSection(section)) {
      return jsonError('Secção inválida.', 404);
    }

    if (!context || !hasAdminPermission(context, getSectionPermission(section))) {
      return jsonError('Sem permissão para carregar ficheiros nesta secção.', 403);
    }

    if (!isRichTextMediaKind(kind)) {
      return jsonError('Tipo de media inválido.', 400);
    }

    if (!file) {
      return jsonError('Ficheiro obrigatório.', 400);
    }

    if (!file.type.startsWith(ACCEPTED_MEDIA[kind])) {
      return jsonError('O ficheiro não corresponde ao tipo de media escolhido.', 400);
    }

    if (kind === 'image' && file.size <= INLINE_RICH_TEXT_IMAGE_MAX_BYTES) {
      const url = await fileToDataUrl(file);
      return NextResponse.json({ url });
    }

    // O ficheiro fica fora do HTML da notícia. A base de dados guarda apenas
    // este URL curto, evitando que uploads de áudio rebentem o pedido multipart.
    const url = await storeUploadedFile(file, `rich-text-${section}-${kind}`);

    return NextResponse.json({ url });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.', 500);
  }
}
