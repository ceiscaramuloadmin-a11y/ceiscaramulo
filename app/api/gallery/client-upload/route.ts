import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const ALLOWED_GALLERY_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/octet-stream',
];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { context, error } = await requireAdminContextFromRequest(request);

        if (error) {
          throw new Error('Sessao administrativa expirada.');
        }

        if (!context || !hasAdminPermission(context, 'gallery')) {
          throw new Error('Sem permissao para carregar media da galeria.');
        }

        return {
          allowedContentTypes: ALLOWED_GALLERY_UPLOAD_CONTENT_TYPES,
          addRandomSuffix: false,
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            adminEmail: context.email,
          }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Nao foi possivel preparar o upload da galeria.' },
      { status: 400 }
    );
  }
}
