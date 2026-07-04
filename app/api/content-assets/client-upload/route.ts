import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSectionPermission,
  hasAdminPermission,
  isContentSection,
  requireAdminContextFromRequest,
  type ContentSection,
} from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const ALLOWED_CONTENT_ASSET_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'application/pdf',
  'application/octet-stream',
];

type ContentAssetClientPayload = {
  section?: ContentSection;
  kind?: 'image' | 'audio' | 'video' | 'document' | 'publication-attachment';
};

function parseClientPayload(value: string | null | undefined): ContentAssetClientPayload {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as ContentAssetClientPayload;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        const section = String(payload.section || '');

        if (!isContentSection(section)) {
          throw new Error('Seccao invalida para upload.');
        }

        const { context, error } = await requireAdminContextFromRequest(request);

        if (error || !context) {
          throw new Error('Sessao administrativa expirada.');
        }

        if (!hasAdminPermission(context, getSectionPermission(section))) {
          throw new Error('Sem permissao para carregar ficheiros nesta seccao.');
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_ASSET_UPLOAD_TYPES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            adminEmail: context.email,
            section,
            kind: payload.kind || 'document',
          }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Nao foi possivel preparar o upload do ficheiro.' },
      { status: 400 }
    );
  }
}
