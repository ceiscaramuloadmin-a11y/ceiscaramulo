export const PUBLIC_DATA_CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export const PUBLIC_MEDIA_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
  'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=604800',
};
