/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('public rich text rendering', () => {
  it('renders rich text content for activity, project and publication detail pages', () => {
    for (const path of [
      'app/atividades/[id]/page.tsx',
      'app/projetos/[id]/page.tsx',
      'app/biblioteca/[id]/page.tsx',
    ]) {
      const source = readAppFile(path);
      expect(source).toContain('prepareRichTextForRender');
      expect(source).toContain('dangerouslySetInnerHTML');
      expect(source).toContain('rich-text-content');
    }
  });

  it('renders rich text previews for projects and publications listing cards', () => {
    for (const path of ['app/projetos/page.tsx', 'app/biblioteca/page.tsx']) {
      const source = readAppFile(path);
      expect(source).toContain('prepareRichTextForRender');
      expect(source).toContain('dangerouslySetInnerHTML');
      expect(source).toContain('rich-text-content');
    }
  });
});
