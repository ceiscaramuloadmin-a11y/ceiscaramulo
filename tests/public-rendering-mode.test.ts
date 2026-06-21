/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const nextConfigSource = readAppFile('next.config.js');
const packageJson = JSON.parse(readAppFile('package.json')) as {
  scripts?: Record<string, string>;
};

describe('public rendering mode', () => {
  it('keeps public database-backed listing pages dynamic', () => {
    for (const path of [
      'app/page.tsx',
      'app/noticias/page.tsx',
      'app/atividades/page.tsx',
      'app/projetos/page.tsx',
      'app/biblioteca/page.tsx',
      'app/galeria/page.tsx',
      'app/sobre-nos/page.tsx',
      'app/serra-do-caramulo/page.tsx',
      'app/contactos/page.tsx',
      'app/pon-do-jueus/page.tsx',
      'app/escola-dos-nossos-avos/page.tsx',
      'app/oficinas-de-formacao/page.tsx',
      'app/oficina-do-burel/page.tsx',
      'app/biblioteca-jrs/page.tsx',
      'app/publicacoes/page.tsx',
    ]) {
      const source = readAppFile(path);
      expect(source).toContain("export const dynamic = 'force-dynamic';");
      expect(source).toContain('export const revalidate = 0;');
    }
  });

  it('does not freeze detail pages with generateStaticParams', () => {
    for (const path of [
      'app/noticias/[slug]/page.tsx',
      'app/atividades/[id]/page.tsx',
      'app/projetos/[id]/page.tsx',
      'app/biblioteca/[id]/page.tsx',
    ]) {
      const source = readAppFile(path);
      expect(source).toContain("export const dynamic = 'force-dynamic';");
      expect(source).toContain('export const revalidate = 0;');
      expect(source).toContain('export const dynamicParams = true;');
      expect(source).not.toContain('export async function generateStaticParams()');
    }
  });

  it('keeps export mode out of development and clears stale chunks before next dev', () => {
    expect(nextConfigSource).toContain("process.env.NODE_ENV === 'production'");
    expect(nextConfigSource).toContain("process.env.NEXT_OUTPUT_MODE === 'export'");
    expect(packageJson.scripts?.predev).toContain("rmSync('.next',{recursive:true,force:true})");
    expect(packageJson.scripts?.dev).toBe('next dev');
  });

  it('keeps Auth0 middleware on the Node.js runtime', () => {
    expect(readAppFile('middleware.ts')).toContain("export const runtime = 'nodejs';");
  });

  it('pins output tracing to this Next.js project root', () => {
    expect(nextConfigSource).toContain('outputFileTracingRoot: __dirname');
  });
});
