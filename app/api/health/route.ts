import { NextResponse } from 'next/server';

// Esta rota confirma rapidamente que a API está operacional.
// É útil para health checks em ambiente local e em produção.
export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ ok: true });
}
