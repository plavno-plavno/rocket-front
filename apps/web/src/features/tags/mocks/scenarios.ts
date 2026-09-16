/**
 * Scenario hooks of the feature (x-mock-scenario). Keys must be one of mocks/db SCENARIOS.
 * `provisional` lists endpoints mocked ahead of the contract (SDD-01T §5.5) — the feature
 * cannot become `ready` while it is non-empty.
 */
export const provisional: string[] = [];
