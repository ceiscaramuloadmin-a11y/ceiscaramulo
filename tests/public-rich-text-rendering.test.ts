/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readAppFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('public rich text rendering', () => {
  it('renders rich text content for news, activity and publication detail pages', () => {
    for (const path of [
      'app/noticias/[slug]/page.tsx',
      'app/atividades/[id]/page.tsx',
      'app/biblioteca/[id]/page.tsx',
    ]) {
      const source = readAppFile(path);
      expect(source).toContain('prepareRichTextForRender');
      expect(source).toContain('dangerouslySetInnerHTML');
      expect(source).toContain('rich-text-content');
    }
  });

  it('renders safe plain-text previews for publication listing cards', () => {
    const source = readAppFile('app/biblioteca/page.tsx');
    expect(source).toContain('richTextToPlainText');
  });
});
