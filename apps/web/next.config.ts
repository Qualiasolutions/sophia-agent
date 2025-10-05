import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile workspace packages */
  transpilePackages: ['@sophiaai/services', '@sophiaai/shared'],

  /* Disable ESLint during builds (we have pre-commit hooks) */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* Allow external images */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
