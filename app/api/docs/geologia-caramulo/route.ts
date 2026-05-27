import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PUBLIC_MEDIA_CACHE_HEADERS } from '@/lib/cache-headers';

export const runtime = 'nodejs';

export async function GET() {
  const filePath = join(process.cwd(), 'docs', 'GeologiaCaramulo.pdf');
  const file = await readFile(filePath);

  return new Response(file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="GeologiaCaramulo.pdf"',
      ...PUBLIC_MEDIA_CACHE_HEADERS,
    },
  });
}
