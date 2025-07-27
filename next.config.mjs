
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'upload.wikimedia.org' },
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'videos.pexels.com' },
            { protocol: 'https', hostname: 'www.freepnglogos.com' },
            { protocol: 'https', hostname: 'cdn.icon-icons.com' },
            { protocol: 'https', hostname: 'www.pngkey.com' },
            { protocol: 'https', hostname: 'logolook.net' }
        ],
    },
    webpack: (config, { isServer }) => {
        // This is to prevent modules that use 'require' in a way that webpack
        // can't statically analyze from causing build failures.
        // We are telling webpack that for the client-side bundle (when isServer is false),
        // it should treat these modules as external, effectively ignoring them.
        if (!isServer) {
            config.externals.push('handlebars', 'node-gyp-build');
        }

        return config;
    },
};

export default nextConfig;
