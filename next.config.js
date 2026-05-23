/** @type {import('next').NextConfig} */
const isExportBuild =
  process.env.NODE_ENV === 'production' && process.env.NEXT_OUTPUT_MODE === 'export';

const nextConfig = {
  output: isExportBuild ? 'export' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.neon.tech',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    unoptimized: isExportBuild,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|pdf|webp|jpg|jpeg|png|gif|ico|woff|woff2|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
};

module.exports = nextConfig;
