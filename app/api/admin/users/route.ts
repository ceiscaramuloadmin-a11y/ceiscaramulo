import { NextRequest, NextResponse } from 'next/server';
import {
  appendAuditLog,
  canManageAdmins,
  deleteAdminPermissions,
  getAdminByEmail,
  jsonError,
  listAdminUsers,
  saveAdminPermissions,
  saveAdminUsers,
  requireAdminContextFromRequest,
} from '@/app/api/_lib/cms';
import type { AdminUserRecord } from '@/app/api/_lib/cms';
import type { AdminPermission, AdminRole } from '@/types';

export const runtime = 'nodejs';

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'];

function normalizeRole(value: unknown): AdminRole {
  return value === 'owner' ? 'owner' : 'editor';
}

function normalizePermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item))
    .filter(
      (item): item is AdminPermission =>
        ['news', 'activities', 'projects', 'publications', 'gallery', 'layout', 'admins', 'audit'].includes(item)
    );
}

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageAdmins(context)) {
    return jsonError('Sem permissão para gerir utilizadores admin.', 403);
  }

  const admins = await listAdminUsers();
  return NextResponse.json(admins);
}

export async function POST(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageAdmins(context)) {
    return jsonError('Sem permissão para gerir utilizadores admin.', 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();
    const role = normalizeRole(body?.role);

    if (!email) {
      return jsonError('Email é obrigatório.', 400);
    }

    const existing = await getAdminByEmail(email);

    if (existing) {
      return jsonError('Este utilizador já existe como admin.', 409);
    }

    const admins = await listAdminUsers();
    const now = new Date().toISOString();
    const created: AdminUserRecord = {
      id: crypto.randomUUID(),
      email,
      role,
      permissions: role === 'owner' ? [...ALL_ADMIN_PERMISSIONS] : [],
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: context.email,
    };

    const updatedList = [...admins, created];
    await saveAdminUsers(updatedList);

    await appendAuditLog({
      actor: context,
      action: 'admin_user_create',
      targetType: 'admin_user',
      targetId: created.id,
      summary: `Admin criado: ${email} (${role}).`,
      after: created,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageAdmins(context)) {
    return jsonError('Sem permissão para gerir utilizadores admin.', 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return jsonError('Email é obrigatório.', 400);
    }

    const role = body?.role !== undefined ? normalizeRole(body.role) : undefined;
    const permissions = body?.permissions !== undefined ? normalizePermissions(body.permissions) : undefined;
    const active = body?.active !== undefined ? Boolean(body.active) : undefined;
    const admins = await listAdminUsers();
    const index = admins.findIndex((item) => item.email === email);

    if (index < 0) {
      return jsonError('Admin não encontrado.', 404);
    }

    const before = admins[index];
    const after: AdminUserRecord = {
      ...before,
      role: role ?? before.role,
      permissions: role === 'owner' ? [...ALL_ADMIN_PERMISSIONS] : permissions ?? before.permissions,
      active: active ?? before.active,
      updatedAt: new Date().toISOString(),
    };

    if (before.email === context.email && after.active === false) {
      return jsonError('Não podes desativar a tua própria conta.', 400);
    }

    if (before.email === context.email && before.role === 'owner' && after.role !== 'owner') {
      return jsonError('Não podes remover o papel de super admin da tua própria conta.', 400);
    }

    admins[index] = after;
    await saveAdminUsers(admins);
    await saveAdminPermissions(after.email, after.permissions);

    await appendAuditLog({
      actor: context,
      action: 'admin_user_update',
      targetType: 'admin_user',
      targetId: after.id,
      summary: `Admin atualizado: ${email}.`,
      before,
      after,
    });

    return NextResponse.json(after);
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !canManageAdmins(context)) {
    return jsonError('Sem permissão para gerir utilizadores admin.', 403);
  }

  try {
    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';

    if (!email) {
      return jsonError('Email é obrigatório.', 400);
    }

    if (email === context.email) {
      return jsonError('Não podes remover a tua própria conta.', 400);
    }

    const admins = await listAdminUsers();
    const index = admins.findIndex((item) => item.email === email);

    if (index < 0) {
      return jsonError('Admin não encontrado.', 404);
    }

    const [removed] = admins.splice(index, 1);
    await saveAdminUsers(admins);
    await deleteAdminPermissions(email);

    await appendAuditLog({
      actor: context,
      action: 'admin_user_delete',
      targetType: 'admin_user',
      targetId: removed.id,
      summary: `Admin removido: ${email}.`,
      before: removed,
    });

    return new NextResponse(null, { status: 204 });
  } catch (caughtError) {
    console.error(caughtError);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
