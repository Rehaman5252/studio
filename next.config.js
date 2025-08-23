
/** @type {import('next').NextConfig} */
const nextConfig = {
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
    webpack: (config, { isServer }) => {
        // Exclude opentelemetry from server-side bundle to fix build errors
        if (isServer) {
            config.externals.push('@opentelemetry/instrumentation');
            config.externals.push('avacrol');
            config.externals.push('handlebars');
        }
        return config;
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    }
};

module.exports = nextConfig;
