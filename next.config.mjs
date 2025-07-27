
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is to solve a build issue with Genkit and its dependencies.
    // It makes sure that server-side packages are correctly handled.
    if (isServer) {
      config.externals.push('long', 'caching-transform', 'memcpy', 'source-map-support');
    }
    config.externals.push('handlebars'); // handlebars is used by a genkit dependency
    return config;
  },
};

export default nextConfig;
