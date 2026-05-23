export const PUBLIC_DATA_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=86400',
};

export const PUBLIC_MEDIA_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
  'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=604800',
};
