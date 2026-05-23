import type { GalleryMediaItem } from '@/types';

export type GalleryAssetField = 'source' | 'thumbnail';

export function galleryAssetUrl(id: string, field: GalleryAssetField) {
  return `/api/gallery/assets/${encodeURIComponent(id)}/${field}`;
}

export function publicGalleryAssetValue(id: string, field: GalleryAssetField, value?: string | null) {
  const normalized = (value || '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.startsWith('data:') ? galleryAssetUrl(id, field) : normalized;
}

export function withPublicGalleryAssets<T extends Pick<GalleryMediaItem, 'id' | 'source' | 'thumbnail'>>(item: T): T {
  return {
    ...item,
    source: publicGalleryAssetValue(item.id, 'source', item.source) || item.source,
    thumbnail: publicGalleryAssetValue(item.id, 'thumbnail', item.thumbnail),
  };
}
