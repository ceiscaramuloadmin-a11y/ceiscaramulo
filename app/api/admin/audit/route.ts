import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission, jsonError, listAuditLogs, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'audit')) {
    return jsonError('Sem permissão para ver a auditoria.', 403);
  }

  const logs = await listAuditLogs();
  return NextResponse.json(logs);
}
