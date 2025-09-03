import type {NextConfig} from 'next';

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
    // Modify webpack config for background and content scripts
    if (!isServer) {
      config.entry = {
        ...config.entry,
        background: './src/background/index.ts',
        content: './src/content/index.ts',
      };

      const originalFilename = config.output.filename;
      config.output.filename = (pathData) => {
        if (pathData.chunk?.name === 'background' || pathData.chunk?.name === 'content') {
          return '[name].js';
        }
        // Fallback to the original filename function for other chunks
        if (typeof originalFilename === 'function') {
           return originalFilename(pathData);
        }
        return originalFilename;
      };
    }
    return config;
  },
};

export default nextConfig;
