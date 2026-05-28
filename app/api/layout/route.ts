import { NextResponse } from 'next/server';
import { jsonError } from '@/app/api/_lib/cms';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const runtime = 'nodejs';

// Endpoint público para leitura das definições de layout do site.
export async function GET() {
  try {
    const settings = await getPublicSiteLayoutSettings();
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
