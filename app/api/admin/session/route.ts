import { NextRequest, NextResponse } from 'next/server';
import { createAdminSessionToken, validateAdminCredentials } from '@/lib/admin-auth-server';
import { getAdminByEmail, jsonError, listAdminUsers, saveAdminUsers } from '@/app/api/_lib/cms';
import type { AdminPermission, AdminUser } from '@/types';

export const runtime = 'nodejs';

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'];

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    const email = String(payload?.email || '').trim().toLowerCase();
    const password = String(payload?.password || '');

    const validated = validateAdminCredentials({ email, password });
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
            createdBy: 'bootstrap',
          } satisfies AdminUser,
        ]);

        admin = await getAdminByEmail(validated.email);
      }
    }

    if (!admin || !admin.active) {
      return jsonError('A conta autenticada não tem acesso ao backoffice.', 403);
    }

    const { token, expiresAt } = await createAdminSessionToken({
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    });

    return NextResponse.json({
      token,
      session: {
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        expiresAt,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Não foi possível iniciar a sessão administrativa.', 401);
  }
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
