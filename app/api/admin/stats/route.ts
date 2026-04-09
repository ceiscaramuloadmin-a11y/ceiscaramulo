import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminFromRequest } from '@/app/api/_lib/cms';

// Esta rota agrega métricas globais para o painel administrativo.
// O acesso é restrito a utilizadores autenticados com perfil admin.
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Validação de sessão e permissões de backoffice.
  const authError = await requireAdminFromRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const [news, activities, projects, publications] = await Promise.all([
      prisma.news.count(),
      prisma.activity.count(),
      prisma.project.count(),
      prisma.publication.count(),
    ]);

    return NextResponse.json({ news, activities, projects, publications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Ocorreu um erro inesperado.' }, { status: 500 });
  }
}

