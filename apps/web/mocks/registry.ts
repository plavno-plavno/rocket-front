/**
 * Feature mock handlers registered with the mock server.
 *
 * Foundation note (SDD-01T §3.2): from T5b this file is generated into
 * `src/generated/mock-registry.ts` from `features/<f>/mocks/handlers.ts`.
 * Until then it is maintained by hand.
 */
import type { HttpHandler } from 'msw';
import { handlers as session } from '@/features/session/mocks/handlers';

export const featureHandlers: HttpHandler[] = [...session];
