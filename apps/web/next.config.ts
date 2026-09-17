import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/**
 * Where `/api/core/*` goes: the core-api origin to proxy to, or `undefined` = mock core-api inside
 * Next.js (docs/deployment.md). Rewrites are baked in at build time, so the decision is made here
 * once and handed to the runtime as `env.MOCK_API_INLINE` (instrumentation, core-client).
 * - `MOCK_API_INLINE=true|1` → inline; `false|0` → proxy to `CORE_API_URL`.
 * - Unset: proxy to `CORE_API_URL`, except on Vercel when it is missing or points to something the
 *   deployment cannot reach (relative, localhost, the deployment itself). Rewriting there served a
 *   Next page instead of JSON (sign-in: «Unexpected token '<'»), so the demo falls back to inline.
 */
function resolveCoreApiUrl(): string | undefined {
  const flag = process.env.MOCK_API_INLINE?.trim().toLowerCase() ?? '';
  const url = process.env.CORE_API_URL?.trim().replace(/\/+$/, '');
  if (flag === 'true' || flag === '1') return undefined;
  if (flag === 'false' || flag === '0' || !process.env.VERCEL) {
    return url || 'http://localhost:4010';
  }
  if (url && isReachableFromVercel(url)) return url;
  console.warn(
    `core-api: CORE_API_URL (${url ? 'unreachable from Vercel' : 'not set'}) → mock core-api inside Next.js`
  );
  return undefined;
}

function isReachableFromVercel(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const ownHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ];
  return (
    /^https?:$/.test(parsed.protocol) &&
    !['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(parsed.hostname) &&
    !ownHosts.includes(parsed.host)
  );
}

const coreApiUrl = resolveCoreApiUrl();

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  env: { MOCK_API_INLINE: String(coreApiUrl === undefined) },
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
    // Inline mock: /api/core/* is served by src/app/api/core/[...path]/route.ts.
    if (coreApiUrl === undefined) return [];
    // Same-origin proxy to core-api so the session cookie is first-party (SDD-01 §5.1, §5.3).
    return [{ source: '/api/core/:path*', destination: `${coreApiUrl}/:path*` }];
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
