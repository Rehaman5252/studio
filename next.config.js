
/** @type {import('next').NextConfig} */
const path = require('path');

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
        config.resolve.alias['@'] = path.resolve(__dirname);
        // This is an advanced configuration to control Webpack's behavior.
        // Restricting infrastructure logging to 'error' reduces console noise during builds,
        // making it easier to spot critical issues.
        config.infrastructureLogging = {
          level: 'error',
        };

        return config;
    },
};

module.exports = nextConfig;
