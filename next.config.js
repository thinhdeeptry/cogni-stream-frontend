/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Images optimization
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Experimental optimizations
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "@tabler/icons-react",
      "react-icons",
    ],
    // Enable turbo for faster builds
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization.usedExports = true;

      // Optimize chunk splitting
      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: "all",
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 5,
              enforce: true,
            },
            // Separate heavy libraries
            charts: {
              test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
              name: "charts",
              chunks: "all",
              priority: 20,
            },
            editor: {
              test: /[\\/]node_modules[\\/](@blocknote|@tinymce)[\\/]/,
              name: "editor",
              chunks: "all",
              priority: 20,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
              name: "ui",
              chunks: "all",
              priority: 15,
            },
          },
        };
      }
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // Build performance
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Runtime optimizations
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Compression
  compress: true,
  poweredByHeader: false,

  // Performance headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },

  // TypeScript and ESLint settings for faster builds
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  // eslint: {
  //   ignoreDuringBuilds: false,
  // },
};

module.exports = nextConfig;
