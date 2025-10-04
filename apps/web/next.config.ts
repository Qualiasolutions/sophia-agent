import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile workspace packages */
  transpilePackages: ['@sophiaai/services', '@sophiaai/shared'],

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
