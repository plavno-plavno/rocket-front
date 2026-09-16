import { http } from '@mocks/lib/http';

/**
 * MSW handlers of the exports feature (SDD-01 §5.3). Registered automatically by `pnpm gen`.
 * Endpoints without a handler answer 501 from the mock server, so missing mocks are visible.
 * Provisional handlers (no contract yet) must be listed in mocks/scenarios.ts as `provisional`.
 */
export const handlers = [] as ReturnType<typeof http.get>[];
