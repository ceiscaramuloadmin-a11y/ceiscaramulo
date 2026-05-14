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
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
