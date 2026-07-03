import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hasAdminPermission, jsonError, requireAdminContextFromRequest } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

const DEFAULT_NEWSLETTER_LIMIT = 200;
const MAX_NEWSLETTER_LIMIT = 500;

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, MAX_NEWSLETTER_LIMIT)) : DEFAULT_NEWSLETTER_LIMIT;
}

export async function GET(request: NextRequest) {
  const { context, error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  if (!context || !hasAdminPermission(context, 'contacts')) {
    return jsonError('Sem permissão para consultar subscritores.', 403);
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  const format = request.nextUrl.searchParams.get('format');
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  if (format === 'csv') {
    const csv = [
      'email,createdAt',
      ...subscribers.map((subscriber) => `${subscriber.email},${subscriber.createdAt.toISOString()}`),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="newsletter-ceiscaramulo.csv"',
      },
    });
  }

  return NextResponse.json(subscribers);
}
