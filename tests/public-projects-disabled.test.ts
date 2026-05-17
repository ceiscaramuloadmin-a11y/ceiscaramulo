/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { navigationItems } from '@/data/navigation';

const readAppFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('public projects surface', () => {
  it('omits Projetos from public navigation', () => {
    expect(navigationItems).not.toContainEqual({ label: 'Projetos', href: '/projetos' });
    expect(navigationItems.map((item) => item.href)).not.toContain('/projetos');
  });

  it('makes public project routes inaccessible', () => {
    for (const path of ['app/projetos/page.tsx', 'app/projetos/[id]/page.tsx']) {
      const source = readAppFile(path);

      expect(source).toContain("import { notFound } from 'next/navigation'");
      expect(source).toContain('notFound()');
      expect(source).not.toContain('prisma.project');
      expect(source).not.toContain('fallbackProjects');
    }
  });
});
