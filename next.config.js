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
        if (isServer) {
            // Exclude opentelemetry from server-side bundle to fix build errors
            config.externals.push('@opentelemetry/instrumentation');
        }
        return config;
    },
    // Increase the timeout for server actions, needed for video generation.
    serverActions: {
        bodySizeLimit: '10mb', // Accommodate larger payloads if needed
    },
    distDir: '.next',
};

module.exports = nextConfig;
