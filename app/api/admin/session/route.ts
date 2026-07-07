import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuthSession } from '@/lib/admin-auth-server';
import { getAdminByEmail, jsonError, listAdminUsers, saveAdminUsers } from '@/app/api/_lib/cms';
import { ADMIN_SIGNED_OUT_COOKIE, ADMIN_SIGNED_OUT_COOKIE_MAX_AGE_SECONDS } from '@/lib/admin-auth-shared';

export const runtime = 'nodejs';

const OWNER_PERMISSIONS = ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'] as const;

async function buildAdminSessionResponse(request: NextRequest) {
  if (request.cookies?.get(ADMIN_SIGNED_OUT_COOKIE)?.value === '1') {
    return jsonError('Sessão terminada. Inicie sessão novamente.', 401);
  }

  const validated = await getAdminAuthSession(request);
  let admin = await getAdminByEmail(validated.email);

  if (!admin) {
    const existingAdmins = await listAdminUsers();

    if (existingAdmins.length === 0) {
      const now = new Date().toISOString();
      await saveAdminUsers([
        {
          id: validated.uid,
          email: validated.email,
          role: 'owner',
          permissions: [...OWNER_PERMISSIONS],
          active: true,
          createdAt: now,
          updatedAt: now,
          createdBy: 'auth0-bootstrap',
        },
      ]);

      admin = await getAdminByEmail(validated.email);
    }
  }

  if (!admin || !admin.active) {
    return jsonError('A conta autenticada não tem acesso ao backoffice.', 403);
  }

  return NextResponse.json({
    token: null,
    session: {
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      expiresAt: validated.expiresAt,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    return await buildAdminSessionResponse(request);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Não foi possível validar a sessão administrativa.', 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await buildAdminSessionResponse(request);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Não foi possível validar a sessão administrativa.', 401);
  }
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(ADMIN_SIGNED_OUT_COOKIE, '1', {
    httpOnly: true,
    maxAge: ADMIN_SIGNED_OUT_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
