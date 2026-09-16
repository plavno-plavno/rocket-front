/** Import boundaries between features and layers (SDD-01T §3.8). Run: pnpm depcruise */
module.exports = {
  forbidden: [
    {
      name: 'feature-to-feature-only-via-index',
      comment: 'features/A may import features/B only through features/B/index.ts',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$']
      }
    },
    {
      name: 'no-circular-features',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { circular: true, viaOnly: { path: '^src/features/' } }
    },
    {
      name: 'ui-and-lp-must-not-import-features',
      comment: 'components/ui and components/lp are generic building blocks',
      severity: 'error',
      from: { path: '^src/components/(ui|lp)/' },
      to: { path: '^src/features/' }
    },
    {
      name: 'features-must-not-import-app',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/app/' }
    },
    {
      name: 'generated-only-from-shell',
      comment: 'registries are consumed by the shell, i18n config, kbar and the mock server',
      severity: 'error',
      from: {
        pathNot: [
          '^src/shell/',
          '^src/lib/i18n/',
          '^src/components/kbar/',
          '^src/components/icons/',
          '^mocks/',
          '^scripts/',
          '^src/generated/'
        ]
      },
      to: { path: '^src/generated/(feature-registry|messages|mock-registry)' }
    },
    {
      name: 'no-direct-tabler-icons',
      comment: 'icons come from @/components/icons (AGENTS.md)',
      severity: 'error',
      from: { pathNot: ['^src/components/icons/', '^src/components/ui/'] },
      to: { path: '@tabler/icons-react' }
    },
    {
      name: 'http-only-from-service',
      comment: 'core-client is used by features/<f>/api/*.ts only',
      severity: 'error',
      from: {
        pathNot: ['^src/features/[^/]+/api/', '^src/lib/api/', '^src/features/session/server\\.ts$']
      },
      to: { path: '^src/lib/api/core-client' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types']
    },
    exclude: { path: ['\\.next', 'e2e', 'test-results'] },
    reporterOptions: { text: { highlightFocused: true } }
  }
};
