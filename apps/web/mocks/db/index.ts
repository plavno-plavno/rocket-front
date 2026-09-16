import { Random } from '../lib/random';
import {
  LOCATION_COUNT,
  seedIdentity,
  seedListings,
  seedLocations,
  seedPlatforms
} from './seed-core';
import { seedQuestionsAndConversations, seedReviews, seedTemplatesAndTags } from './seed-reviews';
import { seedContent, seedEngagement, seedPlatformStuff } from './seed-extra';
import { SCENARIOS, type MockDb, type Scenario } from './types';

export type { MockDb, Scenario } from './types';
export { SCENARIOS } from './types';
export * from './seed-core';

const REVIEW_COUNT = 2400;

function emptyDb(scenario: Scenario): MockDb {
  return {
    scenario,
    seededAt: new Date().toISOString(),
    tenant: undefined as unknown as MockDb['tenant'],
    tenants: [],
    users: [],
    memberships: [],
    invitations: [],
    passwords: new Map(),
    sessions: new Map(),
    twoFactorChallenges: new Map(),
    platforms: [],
    platformAccounts: [],
    groups: [],
    locations: [],
    locationVersions: new Map(),
    listings: [],
    operations: [],
    batches: [],
    batchItems: new Map(),
    imports: new Map(),
    reviews: [],
    reviewVersions: new Map(),
    replies: [],
    notes: [],
    complaints: [],
    activity: [],
    templates: [],
    templateGroups: [],
    tags: [],
    autoReplyRules: [],
    aiProfiles: [],
    questions: [],
    answers: [],
    conversations: [],
    messages: [],
    publications: [],
    mediaAssets: [],
    listingMedia: [],
    products: [],
    campaigns: [],
    widgets: [],
    rankProjects: [],
    duplicates: [],
    notifications: [],
    notificationSettings: undefined as unknown as MockDb['notificationSettings'],
    apiKeys: [],
    webhooks: [],
    webhookDeliveries: new Map(),
    exports: [],
    sourceSettings: undefined as unknown as MockDb['sourceSettings']
  };
}

/** Builds a fresh, deterministic dataset for a scenario (SDD-01 §5.3, proportions from SCR-1 / SCR-4). */
export function buildDb(scenario: Scenario): MockDb {
  const rnd = new Random(42);
  const db = emptyDb(scenario);
  seedIdentity(db, rnd);
  seedPlatforms(db, rnd, scenario);
  seedTemplatesAndTags(db, rnd);
  if (scenario === 'empty_tenant') {
    seedPlatformStuff(db, rnd);
    db.notifications = [];
    db.sourceSettings.platforms = db.sourceSettings.platforms.map((p) => ({
      ...p,
      enabled: false
    }));
    db.platformAccounts = [];
    return db;
  }
  seedLocations(db, rnd, LOCATION_COUNT);
  seedListings(db, rnd, scenario);
  seedReviews(db, rnd, REVIEW_COUNT);
  seedQuestionsAndConversations(db, rnd);
  seedContent(db, rnd);
  seedEngagement(db, rnd);
  seedPlatformStuff(db, rnd);
  return db;
}

const cache = new Map<Scenario, MockDb>();

export function isScenario(value: string | null | undefined): value is Scenario {
  return !!value && (SCENARIOS as string[]).includes(value);
}

/** Per-scenario state, isolated so that e.g. `empty_tenant` requests never see seeded data. */
export function getDb(scenario: Scenario = 'seed_default'): MockDb {
  let db = cache.get(scenario);
  if (!db) {
    db = buildDb(scenario);
    cache.set(scenario, db);
  }
  return db;
}

export function resetDb(scenario?: Scenario) {
  if (scenario) cache.delete(scenario);
  else cache.clear();
}

/** Resolves the scenario for a request from the `x-mock-scenario` header. */
export function dbFor(request: Request): MockDb {
  const header = request.headers.get('x-mock-scenario');
  return getDb(isScenario(header) ? header : 'seed_default');
}
