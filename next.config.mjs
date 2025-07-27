/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // This is to fix a build error for `node-pre-gyp` which is a dependency of `fsevents` which is a dependency of `chokidar`
        // It's not used in the browser, so we can ignore it.
        // https://github.com/firebase/firebase-admin-node/issues/1972
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                'fsevents': false,
            };
        }
        // These packages are not used in the browser, so we can ignore them.
        config.externals.push('pino-pretty', 'lokijs', 'encoding', 'handlebars');
        return config;
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'videos.pexels.com',
            },
             {
                protocol: 'https',
                hostname: 'logolook.net',
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
            }
        ],
    },
};

export default nextConfig;
