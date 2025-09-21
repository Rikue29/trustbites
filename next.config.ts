import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Amplify deployment optimizations
  output: 'standalone',
  
  // Environment configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization for Amplify
  images: {
    unoptimized: true, // Required for Amplify SSG
    domains: [
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'places.googleapis.com'
    ],
  },
  
  // AWS Amplify specific settings
  trailingSlash: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['chart.js', 'react-chartjs-2'],
  },
  
  // Build configuration
  eslint: {
    // Disable ESLint during builds (we use Biome)
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Type checking during build
    ignoreBuildErrors: false,
  },
  
  // Webpack configuration for AWS SDK (only when not using Turbopack)
  webpack: (config, { isServer, dev }) => {
    // Only apply webpack config when not using Turbopack
    if (!dev || !process.env.TURBOPACK) {
      // AWS SDK optimization
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
    }
    
    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
