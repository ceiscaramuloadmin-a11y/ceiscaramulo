import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken } from '@/lib/admin-auth-server';
import { getAdminByEmail, jsonError, listAdminUsers, saveAdminUsers } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const OWNER_PERMISSIONS = ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'] as const;

function extractFirebaseIdToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || request.headers.get('Authorization') || '';

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return authorization.slice(7).trim();
}

export async function POST(request: NextRequest) {
  try {
    const firebaseIdToken = extractFirebaseIdToken(request);

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
            id: validated.uid,
            email: validated.email,
            role: 'owner',
            permissions: [...OWNER_PERMISSIONS],
            active: true,
            createdAt: now,
            updatedAt: now,
            createdBy: 'firebase-bootstrap',
          },
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
    return jsonError(
      error instanceof Error ? error.message : 'Não foi possível iniciar a sessão administrativa.',
      401
    );
  }
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
