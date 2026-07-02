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

  it('opens the first available media type instead of showing an empty photos tab', () => {
    expect(galleryTabsSource).toContain('function firstAvailableGalleryTab');
    expect(galleryTabsSource).toContain("useState<TabId>(() => firstAvailableGalleryTab(items))");
    expect(galleryTabsSource).toContain("if (items.some((item) => item.type === 'document')) return 'document'");
    expect(galleryTabsSource).toContain('setActiveTab(firstAvailableGalleryTab(items))');
  });

  it('keeps the media type bar horizontally scrollable on narrow screens', () => {
    expect(galleryTabsSource).toContain('role="tablist"');
    expect(galleryTabsSource).toContain('aria-label="Tipos de conteúdos da galeria"');
    expect(galleryTabsSource).toContain('overflow-x-auto');
    expect(galleryTabsSource).toContain('snap-x');
    expect(galleryTabsSource).toContain('min-w-[180px]');
    expect(galleryTabsSource).toContain('role="tab"');
    expect(galleryTabsSource).toContain('aria-selected={activeTab === tab.id}');
  });

  it('keeps static local gallery photo previews eligible for next/image with responsive thumbnail sizes', () => {
    expect(galleryTabsSource).toContain("import Image from 'next/image'");
    expect(galleryTabsSource).toContain("previewSource.startsWith('/') && !shouldBypassNextImageOptimization(previewSource)");
    expect(galleryTabsSource).toContain('sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"');
    expect(galleryTabsSource).toContain('loading="lazy"');
    expect(galleryTabsSource).toContain('decoding="async"');
  });
});
