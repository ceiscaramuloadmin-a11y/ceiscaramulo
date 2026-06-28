import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  const logs = await listAuditLogs();
  return NextResponse.json(logs);
}
