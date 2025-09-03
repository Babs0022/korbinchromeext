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
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      config.entry = {
        ...config.entry,
        'background/index': path.resolve(__dirname, './src/background/index.ts'),
        'content/index': path.resolve(__dirname, './src/content/index.ts'),
      };

      // Ensure correct output filenames for background and content scripts
      if (config.output) {
        config.output.filename = (pathData) => {
          if (pathData.chunk?.name?.startsWith('background/') || pathData.chunk?.name?.startsWith('content/')) {
            return '[name].js';
          }
          return 'static/chunks/[name]-[contenthash].js';
        };
      }
    }
    return config;
  },
};

export default nextConfig;
