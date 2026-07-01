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

  it('resolves uploaded media URLs inside news rich text before rendering', () => {
    const source = readAppFile('app/noticias/[slug]/page.tsx');

    expect(source).toContain('prepareRichTextForRender(article.content, { resolveMediaUrl: getAssetUrl })');
  });

  it('does not render the news cover image inside the news detail body', () => {
    const source = readAppFile('app/noticias/[slug]/page.tsx');

    expect(source).not.toContain('src={getAssetUrl(article.image)}');
  });

  it('does not render the activity cover image inside the activity detail body', () => {
    const source = readAppFile('app/atividades/[id]/page.tsx');

    expect(source).not.toContain('src={getAssetUrl(activity.image)}');
  });

  it('resolves uploaded media URLs inside activity and publication rich text before rendering', () => {
    expect(readAppFile('app/atividades/[id]/page.tsx')).toContain(
      'prepareRichTextForRender(activity.description, { resolveMediaUrl: getAssetUrl })'
    );
    expect(readAppFile('app/biblioteca/[id]/page.tsx')).toContain(
      'prepareRichTextForRender(publication.description, { resolveMediaUrl: getAssetUrl })'
    );
  });

  it('renders safe plain-text previews for publication listing cards', () => {
    const source = readAppFile('app/biblioteca/page.tsx');
    expect(source).toContain('richTextToPlainText');
  });

  it('keeps the library page practical with search, filters and result feedback', () => {
    const source = readAppFile('app/biblioteca/page.tsx');

    expect(source).toContain('parseBibliotecaQueryParam(sp.q)');
    expect(source).toContain('buildBibliotecaPublicationWhere(tipo, query)');
    expect(source).toContain('take: MAX_PUBLIC_BIBLIOTECA_RESULTS');
    expect(source).toContain("distinct: ['type']");
    expect(source).toContain('role="search"');
    expect(source).toContain('placeholder="Pesquisar por título, autor, ano ou tema"');
    expect(source).toContain('recurso(s) encontrado(s)');
    expect(source).toContain('Limpar filtros');
    expect(source).toContain('href={`/biblioteca?tipo=${encodeURIComponent(code)}${querySuffix}`}');
  });

  it('keeps publication detail slug lookup lightweight', () => {
    const source = readAppFile('app/biblioteca/[id]/page.tsx');

    expect(source).toContain("import * as React from 'react'");
    expect(source).toContain('const cachePublicationLookup = typeof React.cache');
    expect(source).toContain('const getPublication = cachePublicationLookup(async function getPublication');
    expect(source).toContain('select: { id: true, title: true }');
    expect(source).toContain('take: MAX_PUBLICATION_SLUG_LOOKUP_ROWS');
    expect(source).toContain('id: publicationSlugMatch.id');
  });
});
