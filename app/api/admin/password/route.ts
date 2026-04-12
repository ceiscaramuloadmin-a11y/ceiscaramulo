import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContextFromRequest } from '@/app/api/_lib/cms';
import { getAdminAuthSession } from '@/lib/admin-auth-server';
import { updateAuth0UserPassword } from '@/lib/auth0-management';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminContextFromRequest(request);

  if (error) {
    return error;
  }

  try {
    const session = await getAdminAuthSession(request);
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || '').trim();
    const confirmPassword = String(body?.confirmPassword || '').trim();

    if (password.length < 6) {
      return jsonError('A nova palavra-passe deve ter pelo menos 6 caracteres.', 400);
    }

    if (password !== confirmPassword) {
      return jsonError('A confirmação da palavra-passe não coincide.', 400);
    }

    await updateAuth0UserPassword(session.uid, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Não foi possível atualizar a palavra-passe.', 500);
  }
}
