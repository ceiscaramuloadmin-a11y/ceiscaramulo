import { NextRequest, NextResponse } from 'next/server';
import { listGalleryMedia, requireAdminFromRequest } from '@/app/api/_lib/cms';
import prisma from '@/lib/prisma';

// Esta rota agrega métricas globais para o painel administrativo.
// O acesso é restrito a utilizadores autenticados com perfil admin.
export const runtime = 'nodejs';

const DASHBOARD_GALLERY_CONTEXTS = [
  'oficina-do-burel',
  'artigos-para-venda',
  'biblioteca-jrs',
  'pon-do-jueus',
  'escola-dos-nossos-avos',
  'oficinas-de-formacao',
  'publicacoes',
  'biblioteca',
];

export async function GET(request: NextRequest) {
  // Validação de sessão e permissões de backoffice.
  const authError = await requireAdminFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const [news, activities, projects, publications, contacts, galleryContextEntries] = await Promise.all([
      prisma.news.count(),
      prisma.activity.count(),
      prisma.project.count(),
      prisma.publication.count(),
      prisma.contactMessage.count(),
      Promise.all(
        DASHBOARD_GALLERY_CONTEXTS.map(async (context) => {
          const items = await listGalleryMedia('admin', context);
          return [context, items.length] as const;
        })
      ),
    ]);

    return NextResponse.json({
      news,
      activities,
      projects,
      publications,
      contacts,
      galleryByContext: Object.fromEntries(galleryContextEntries),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Ocorreu um erro inesperado.' }, { status: 500 });
  }
}
