import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  return NextResponse.json(context);
}
