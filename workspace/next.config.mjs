/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.icon-icons.com',
        port: '',
        pathname: '**',
      },
       {
        protocol: 'https',
        hostname: 'www.freepnglogos.com',
        port: '',
        pathname: '**',
      },
       {
        protocol: 'https',
        hostname: 'logolook.net',
        port: '',
        pathname: '**',
      },
       {
        protocol: 'https',
        hostname: 'www.pngkey.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
