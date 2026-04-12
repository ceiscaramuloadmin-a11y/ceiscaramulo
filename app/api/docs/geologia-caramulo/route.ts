import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const filePath = join(process.cwd(), 'docs', 'GeologiaCaramulo.pdf');
  const file = await readFile(filePath);

  return new Response(file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="GeologiaCaramulo.pdf"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
