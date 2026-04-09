import { NextResponse } from 'next/server';
import { getSiteLayoutSettings, jsonError } from '@/app/api/_lib/cms';

export const runtime = 'nodejs';

// Endpoint público para leitura das definições de layout do site.
export async function GET() {
  try {
    const settings = await getSiteLayoutSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return jsonError('Ocorreu um erro inesperado.', 500);
  }
}
