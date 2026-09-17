import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: ''
      }
    ]
  },
  // Dev server opened via LAN IP / 127.0.0.1 (not only localhost) — otherwise Next blocks HMR/RSC
  // requests as cross-origin and client JS never runs (forms submit natively).
  allowedDevOrigins: [
    '127.0.0.1',
    '192.168.*.*',
    '10.*.*.*',
    '*.local',
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(',') ?? [])
  ],
  // The dev-tools badge overlaps the sidebar footer and intercepts clicks in e2e runs.
  devIndicators: process.env.NEXT_DEV_INDICATORS === 'false' ? false : undefined,
  transpilePackages: ['geist'],
  async rewrites() {
    // Same-origin proxy to core-api so the session cookie is first-party (SDD-01 §5.1, §5.3).
    const core = (process.env.CORE_API_URL ?? 'http://localhost:4010').replace(/\/$/, '');
    return [{ source: '/api/core/:path*', destination: `${core}/:path*` }];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

let configWithPlugins = withNextIntl(baseConfig);

// Conditionally enable Sentry configuration
if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
  configWithPlugins = withSentryConfig(configWithPlugins, {
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    tunnelRoute: '/monitoring',

    // Disable Sentry telemetry
    telemetry: false,

    // Sentry v10: moved under webpack namespace
    webpack: {
      reactComponentAnnotation: {
        enabled: true
      },
      treeshake: {
        removeDebugLogging: true
      }
    },

    // Disable source map upload when org/project are not configured
    sourcemaps: {
      disable: !process.env.NEXT_PUBLIC_SENTRY_ORG || !process.env.NEXT_PUBLIC_SENTRY_PROJECT
    }
  });
}

const nextConfig = configWithPlugins;
export default nextConfig;
