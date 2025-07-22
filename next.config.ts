

import type {NextConfig} from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Enables SWC minification for a faster production build.
  swcMinify: true, 
  // Enables gzip compression for smaller asset sizes and faster loading.
  compress: true, 
  typescript: {
    // Allows the project to build even if there are TypeScript errors.
    // Recommended to be false in a CI/CD environment.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows the project to build even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    // Defines a list of allowed hostnames for the next/image component.
    // This improves security by preventing images from being loaded from untrusted sources.
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
