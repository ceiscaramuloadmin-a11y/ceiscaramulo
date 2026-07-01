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

  it('keeps static local gallery photo previews eligible for next/image with responsive thumbnail sizes', () => {
    expect(galleryTabsSource).toContain("import Image from 'next/image'");
    expect(galleryTabsSource).toContain("previewSource.startsWith('/') && !shouldBypassNextImageOptimization(previewSource)");
    expect(galleryTabsSource).toContain('sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"');
    expect(galleryTabsSource).toContain('loading="lazy"');
    expect(galleryTabsSource).toContain('decoding="async"');
  });
});
