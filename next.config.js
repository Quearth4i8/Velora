/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // pg is a server-only native module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        'pg-native': false,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
        stream: false,
        os: false,
        path: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        url: false,
        string_decoder: false,
        util: false,
        assert: false,
        buffer: false,
        events: false,
        constants: false,
        timers: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
