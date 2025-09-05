
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
        // Restrict build output to errors only
        config.infrastructureLogging = {
          level: 'error',
        };

        config.stats = {
          all: false,
          errors: true,
          errorsCount: true,
          errorDetails: true,
        };

        return config;
    },
};

module.exports = nextConfig;
