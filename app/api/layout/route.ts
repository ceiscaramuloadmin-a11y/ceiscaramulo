import { NextResponse } from 'next/server';
import { jsonError } from '@/app/api/_lib/cms';
import { PUBLIC_DATA_CACHE_HEADERS } from '@/lib/cache-headers';
import { getPublicSiteLayoutSettings } from '@/lib/site-layout-settings';

export const runtime = 'nodejs';

// Endpoint público para leitura das definições de layout do site.
export async function GET() {
  try {
    const settings = await getPublicSiteLayoutSettings();
    return NextResponse.json(settings, {
      headers: PUBLIC_DATA_CACHE_HEADERS,
    });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
