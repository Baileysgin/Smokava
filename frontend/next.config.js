/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [
      // Extract domain from API URL if provided
      ...(process.env.NEXT_PUBLIC_API_URL
        ? [process.env.NEXT_PUBLIC_API_URL.replace(/https?:\/\//, '').split('/')[0]]
        : []),
      // Add custom domain if provided
      ...(process.env.NEXT_PUBLIC_IMAGE_DOMAIN ? [process.env.NEXT_PUBLIC_IMAGE_DOMAIN] : []),
      // No localhost - use NEXT_PUBLIC_IMAGE_DOMAIN for development images
    ].filter(Boolean),
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  webpack: (config, { isServer }) => {
    // Enable WebAssembly support for heic2any
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    return config;
  },
}

module.exports = nextConfig
