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
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
};

module.exports = nextConfig;
