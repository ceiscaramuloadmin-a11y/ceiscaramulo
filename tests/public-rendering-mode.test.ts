/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

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
    ]) {
      expect(readAppFile(path)).toContain("export const dynamic = 'force-dynamic';");
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
      expect(source).toContain('export const dynamicParams = true;');
      expect(source).not.toContain('export async function generateStaticParams()');
    }
  });
});
