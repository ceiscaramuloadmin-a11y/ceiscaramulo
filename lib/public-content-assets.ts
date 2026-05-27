export type PublicContentSection = 'news' | 'activities' | 'projects' | 'publications';
export type PublicContentAssetField = 'image' | 'coverImage';

const ASSET_FIELDS: Record<PublicContentSection, PublicContentAssetField> = {
  news: 'image',
  activities: 'image',
  projects: 'image',
  publications: 'coverImage',
};

export function publicContentAssetUrl(section: PublicContentSection, id: string) {
  return `/api/content-assets/${section}/${encodeURIComponent(id)}`;
}

export function publicAssetValue(section: PublicContentSection, id: string, value?: string | null) {
  const normalized = (value || '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.startsWith('data:') ? publicContentAssetUrl(section, id) : normalized;
}

export function withPublicContentAsset<T extends { id: string }>(
  section: PublicContentSection,
  item: T
): T {
  const field = ASSET_FIELDS[section];
  const value = item[field as keyof T];

  return {
    ...item,
    [field]: publicAssetValue(section, item.id, typeof value === 'string' ? value : null),
  };
}
