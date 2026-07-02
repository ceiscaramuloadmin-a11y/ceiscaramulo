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

  it('opens on the first available media type but keeps empty tabs selectable afterwards', () => {
    expect(galleryTabsSource).toContain('function firstAvailableGalleryTab');
    expect(galleryTabsSource).toContain("useState<TabId>(() => firstAvailableGalleryTab(items))");
    expect(galleryTabsSource).toContain("if (items.some((item) => item.type === 'document')) return 'document'");
    expect(galleryTabsSource).not.toContain('setActiveTab(firstAvailableGalleryTab(items))');
    expect(galleryTabsSource).toContain('GALLERY_TABS');
    expect(galleryTabsSource).toContain('selectAdjacentTab');
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

  it('allows moving sideways between tabs even when the target tab is empty', () => {
    expect(galleryTabsSource).toContain('TAB_SWIPE_THRESHOLD');
    expect(galleryTabsSource).toContain('handleTabSwipeEnd');
    expect(galleryTabsSource).toContain('onTouchStart={(event) =>');
    expect(galleryTabsSource).toContain('onTouchEnd={(event) =>');
    expect(galleryTabsSource).toContain("event.key === 'ArrowRight'");
    expect(galleryTabsSource).toContain("event.key === 'ArrowLeft'");
    expect(galleryTabsSource).toContain('selectAdjacentTab(deltaX < 0 ? 1 : -1)');
  });

  it('keeps static local gallery photo previews eligible for next/image with responsive thumbnail sizes', () => {
    expect(galleryTabsSource).toContain("import Image from 'next/image'");
    expect(galleryTabsSource).toContain("previewSource.startsWith('/') && !shouldBypassNextImageOptimization(previewSource)");
    expect(galleryTabsSource).toContain('sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"');
    expect(galleryTabsSource).toContain('loading="lazy"');
    expect(galleryTabsSource).toContain('decoding="async"');
  });
});
