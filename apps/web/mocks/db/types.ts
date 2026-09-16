import type { Schema } from '@lp/contracts';

export type Scenario =
  | 'seed_default'
  | 'empty_tenant'
  | 'challenge_required'
  | 'connector_degraded';
export const SCENARIOS: Scenario[] = [
  'seed_default',
  'empty_tenant',
  'challenge_required',
  'connector_degraded'
];

export interface MockSession {
  token: string;
  userId: string;
  tenantId: string;
  createdAt: string;
}

export interface MockImport {
  id: string;
  columns: string[];
  rows: (string | null)[][];
  mapping?: Record<string, string>;
}

/** In-memory state of the mock core-api for one scenario. Handlers read and mutate it. */
export interface MockDb {
  scenario: Scenario;
  seededAt: string;

  // identity
  tenant: Schema<'Tenant'>;
  tenants: Schema<'Me'>['tenants'];
  users: Schema<'User'>[];
  memberships: Schema<'Membership'>[];
  invitations: Schema<'Invitation'>[];
  passwords: Map<string, string>;
  sessions: Map<string, MockSession>;
  twoFactorChallenges: Map<string, string>;

  // platforms & locations
  platforms: Schema<'Platform'>[];
  platformAccounts: Schema<'PlatformAccount'>[];
  groups: Schema<'LocationGroup'>[];
  locations: Schema<'Location'>[];
  locationVersions: Map<string, Schema<'LocationVersion'>[]>;
  listings: Schema<'Listing'>[];
  operations: Schema<'SyncOperation'>[];
  batches: Schema<'SyncBatch'>[];
  batchItems: Map<string, Schema<'SyncBatchItem'>[]>;
  imports: Map<string, MockImport>;

  // reviews & tooling
  reviews: Schema<'Review'>[];
  reviewVersions: Map<string, Schema<'ReviewVersion'>[]>;
  replies: Schema<'ReviewReply'>[];
  notes: Schema<'ReviewNote'>[];
  complaints: Schema<'ReviewComplaint'>[];
  activity: Schema<'ReviewActivity'>[];
  templates: Schema<'ReplyTemplate'>[];
  templateGroups: Schema<'TemplateGroup'>[];
  tags: Schema<'Tag'>[];
  autoReplyRules: Schema<'AutoReplyRule'>[];
  aiProfiles: Schema<'AiReplyProfile'>[];
  questions: Schema<'Question'>[];
  answers: Schema<'Answer'>[];
  conversations: Schema<'Conversation'>[];
  messages: Schema<'ConversationMessage'>[];

  // content & engagement
  publications: Schema<'Publication'>[];
  mediaAssets: Schema<'MediaAsset'>[];
  listingMedia: Schema<'ListingMedia'>[];
  products: Schema<'Product'>[];
  campaigns: Schema<'Campaign'>[];
  widgets: Schema<'Widget'>[];
  rankProjects: Schema<'RankProject'>[];
  duplicates: Schema<'DuplicateCase'>[];

  // platform
  notifications: Schema<'Notification'>[];
  notificationSettings: Schema<'NotificationSettings'>;
  apiKeys: Schema<'ApiKey'>[];
  webhooks: Schema<'Webhook'>[];
  webhookDeliveries: Map<string, Schema<'WebhookDelivery'>[]>;
  exports: Schema<'Export'>[];
  sourceSettings: Schema<'SourceSettings'>;
}
