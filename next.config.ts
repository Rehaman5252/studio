import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // This should be false in a CI/CD environment to enforce type safety.
    // Set to true to allow building even with TypeScript errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows building even if there are ESLint warnings or errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'assets.stickpng.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'videos.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'www.freepnglogos.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.icon-icons.com',
      },
      {
        protocol: 'https',
        hostname: 'www.pngkey.com',
      },
      {
        protocol: 'https',
        hostname: 'logolook.net',
      }
    ],
  },
};

export default nextConfig;
