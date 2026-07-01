import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';
const DEFAULT_ADMIN_AUDIT_LIMIT = 100;
const MAX_ADMIN_AUDIT_LIMIT = 300;

function parseAuditLimit(value: string | null) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_ADMIN_AUDIT_LIMIT;
  }

  return Math.max(1, Math.min(parsed, MAX_ADMIN_AUDIT_LIMIT));
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  const url = new URL(request.url);
  const logs = await listAuditLogs(parseAuditLimit(url.searchParams.get('limit')));
  return NextResponse.json(logs);
}
