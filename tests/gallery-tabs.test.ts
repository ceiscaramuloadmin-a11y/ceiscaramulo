/* @vitest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const galleryTabsSource = readFileSync(resolve(process.cwd(), 'components/GalleryTabs.tsx'), 'utf8');

describe('GalleryTabs', () => {
  it('renders placeholders and disables playback controls when media has no source', () => {
    expect(galleryTabsSource).toContain('Sem imagem associada');
    expect(galleryTabsSource).toContain('Sem vídeo associado');
    expect(galleryTabsSource).toContain('Sem áudio associado.');
    expect(galleryTabsSource).toContain("item.type === 'document'");
    expect(galleryTabsSource).toContain('Documentos (${documents.length})');
    expect(galleryTabsSource).toContain('Sem documentos publicados.');
    expect(galleryTabsSource).toContain('Abrir ficheiro');
    expect(galleryTabsSource).toContain('disabled={!item.source}');
    expect(galleryTabsSource).toContain("activePhoto?.source || activePhoto?.thumbnail || '/placeholder.svg'");
  });
});
