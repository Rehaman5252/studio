
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    reactStrictMode: true,
    swcMinify: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
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
            },
            {
                protocol: 'https',
                hostname: 'videos.pexels.com',
            }
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    webpack(config, { webpack, isServer }) {
      // This is a temporary addition to help debug build errors.
      // It will be removed once the root cause is identified.
      if (!isServer) {
        config.stats = {
          all: false,
          errors: true,
          errorsCount: true,
          errorDetails: true, 
        };
        config.infrastructureLogging = {
          level: 'error', 
        };
      }
      return config;
    },
};

module.exports = nextConfig;
