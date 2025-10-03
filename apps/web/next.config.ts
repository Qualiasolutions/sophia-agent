import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile workspace packages */
  transpilePackages: ['@sophiaai/services', '@sophiaai/shared'],
};

export default nextConfig;
