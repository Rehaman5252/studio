
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Enforcing type safety is crucial for a production app.
    ignoreBuildErrors: false,
  },
  eslint: {
    // It's best practice to resolve linting issues, not ignore them.
    ignoreDuringBuilds: false,
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
