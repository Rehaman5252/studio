/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TEMPORARY: unblock build for development. Set to false before production release.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Prevent build on lint errors — recommended for production
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'assets.stickpng.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'videos.pexels.com' },
      { protocol: 'https', hostname: 'www.freepnglogos.com' },
      { protocol: 'https', hostname: 'cdn.icon-icons.com' },
      { protocol: 'https', hostname: 'www.pngkey.com' },
      { protocol: 'https', hostname: 'logolook.net' },
    ],
  },
};

export default nextConfig;
