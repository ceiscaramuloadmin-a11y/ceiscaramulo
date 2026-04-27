import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken } from '@/lib/admin-auth-server';
import { getAdminByEmail, jsonError, listAdminUsers, saveAdminUsers } from '@/app/api/_lib/cms';
import type { AdminUserRecord } from '@/app/api/_lib/cms';
import type { AdminPermission } from '@/types';

export const runtime = 'nodejs';

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'];

async function extractFirebaseIdToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';

  if (authorization.startsWith('Bearer ')) {
    const bearerToken = authorization.slice('Bearer '.length).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  const payload = (await request.json().catch(() => null)) as { idToken?: string } | null;
  return String(payload?.idToken || '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const firebaseIdToken = await extractFirebaseIdToken(request);

    if (!firebaseIdToken) {
      return jsonError('Sessão Firebase inválida ou em falta.', 401);
    }

    const validated = await verifyAdminSessionToken(firebaseIdToken);
    let admin = await getAdminByEmail(validated.email);

    if (!admin) {
      const existingAdmins = await listAdminUsers();

      if (existingAdmins.length === 0) {
        const now = new Date().toISOString();
        await saveAdminUsers([
          {
            id: `bootstrap:${validated.email}`,
            email: validated.email,
            role: 'owner',
            permissions: [...ALL_ADMIN_PERMISSIONS],
            active: true,
            createdAt: now,
            updatedAt: now,
            createdBy: 'firebase-bootstrap',
          } satisfies AdminUserRecord,
        ]);

        admin = await getAdminByEmail(validated.email);
      }
    }

    if (!admin || !admin.active) {
      return jsonError('A conta autenticada não tem acesso ao backoffice.', 403);
    }

    return NextResponse.json({
      token: firebaseIdToken,
      session: {
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        expiresAt: validated.expiresAt,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Não foi possível iniciar a sessão administrativa.', 401);
  }
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
