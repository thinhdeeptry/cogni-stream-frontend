/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Runtime configuration - allows environment variables to be read at runtime
  publicRuntimeConfig: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://be.cognistream.id.vn",
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    NEXT_PUBLIC_TINYMCE_API_KEY: process.env.NEXT_PUBLIC_TINYMCE_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },

  serverRuntimeConfig: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Images optimization
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "files.fullstack.edu.vn",
      },
      {
        protocol: "https",
        hostname: "*.cognistream.id.vn",
      },
      {
        protocol: "https",
        hostname: "cognistream.id.vn",
      },
      {
        protocol: "https",
        hostname: "storage.cognistream.io.vn",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
    // Disable image optimization in production to avoid 400 errors
    unoptimized: process.env.NODE_ENV === "production",
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
