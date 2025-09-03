import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.entry = {
        ...config.entry,
        background: './src/background/index.ts',
        content: './src/content/index.ts',
      };

      config.output = {
        ...config.output,
        filename: (pathData) => {
          if (pathData.chunk?.name === 'background' || pathData.chunk?.name === 'content') {
            return '[name].js';
          }
          return config.output.filename;
        },
      };
    }
    return config;
  },
};

export default nextConfig;
