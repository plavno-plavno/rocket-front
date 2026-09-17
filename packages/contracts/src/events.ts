/**
 * Events between services (SDD-00 §7). The envelope and every `data` shape are
 * mirrored in `events/asyncapi.yaml`. Transport: NATS JetStream, subject
 * `lp.events.<type>`; consumers are idempotent by `event_id`, ordering is per
 * `listing_id` / `review_id` key.
 *
 * Services never read each other's databases (README rule 3), so events carry
 * the data a consumer needs: `location.*` include the canonical location,
 * `platform_account.*` the account descriptor, `review.ingested` the whole review.
 */
import type { Schema } from './index';
import type { CanonicalField, CanonicalPatchEntry, ConnectorErrorShape } from './jobs';

export interface EventEnvelope<T extends EventType = EventType> {
  event_id: string;
  type: T;
  version: number;
  tenant_id: string;
  occurred_at: string;
  producer: Producer;
  trace_id: string;
  data: EventData[T];
}

export type Producer = 'core-api' | 'sync-engine' | 'matching' | 'connector-runtime' | 'stats-collector' | 'rank-tracker' | 'platform-simulator';

export const EVENT_SUBJECT_PREFIX = 'lp.events.';
export const eventSubject = (type: EventType): string => `${EVENT_SUBJECT_PREFIX}${type}`;

export type SyncStatus = Schema<'SyncStatus'>;
export type ActionReason = Schema<'ActionReason'>;
export type OperationState = Schema<'SyncOperationState'>;

export interface LocationSnapshot extends Schema<'LocationCore'> {
  id: string;
  version: number;
  group_ids?: string[];
}

export interface PlatformAccountDescriptor {
  id: string;
  platform_id: string;
  auth_kind: Schema<'PlatformAccountAuthKind'>;
  status: Schema<'PlatformAccountStatus'>;
  display_name?: string | null;
  /** Reference to the vault entry holding the account secrets (never the secrets). */
  vault_ref?: string | null;
  external_account_id?: string | null;
}

export interface EventData {
  // ── core-api → sync / matching ────────────────────────────────────────────
  'location.created': { location_id: string; version: number; created_by?: string | null; source?: 'ui' | 'import' | 'api'; location: LocationSnapshot };
  'location.changed': {
    location_id: string;
    version: number;
    changed_fields: (CanonicalField | '*' | string)[];
    changed_by?: string | null;
    rollback_of?: number | null;
    batch_id?: string | null;
    location: LocationSnapshot;
  };
  'location.deleted': { location_id: string; deleted_by?: string | null };
  'location.schedule.due': { location_id: string; effective_at: string; location: LocationSnapshot };
  'sync.batch.requested': { batch_id: string; kind: Schema<'SyncBatch'>['kind']; location_ids: string[]; changed_fields: string[]; requested_by?: string | null };
  'listing.action.requested': {
    listing_id: string;
    location_id: string | null;
    platform_id: string;
    action: Schema<'ListingAction'>['action'];
    operation_id?: string | null;
    batch_id?: string | null;
    requested_by?: string | null;
  };
  'platform_account.check.requested': { platform_account_id: string; platform_id: string; initial?: boolean; account: PlatformAccountDescriptor };
  'platform_account.changed': {
    platform_account_id: string;
    platform_id?: string;
    status: Schema<'PlatformAccountStatus'>;
    last_checked_at?: string | null;
    error?: string | null;
    account?: PlatformAccountDescriptor;
  };
  'review.reply.requested': { reply_id: string; review_id: string; listing_id: string; platform_id: string; text: string; delete?: boolean; review_external_id?: string | null; reply_external_id?: string | null };
  'review.reply.changed': { reply_id: string; review_id: string; state: Schema<'ReplyState'>; external_id?: string | null; published_at?: string | null; error?: string | null };
  'review.complaint.requested': { complaint_id: string; review_id: string; listing_id: string; platform_id: string; reason_code: string; text?: string | null; review_external_id?: string | null };
  'review.complaint.changed': { complaint_id: string; review_id: string; state: Schema<'ComplaintState'>; submitted_at?: string | null; error?: string | null };
  'question.answer.requested': { answer_id: string; question_id: string; listing_id: string; platform_id: string; text: string; question_external_id?: string | null };
  'question.answer.changed': { answer_id: string; question_id: string; state: 'published' | 'failed'; external_id?: string | null; published_at?: string | null; error?: string | null };
  'publication.requested': {
    publication_id: string;
    listing_ids: string[];
    delete?: boolean;
    type?: Schema<'PublicationType'>;
    title?: string | null;
    text?: string;
    media_ids?: string[];
    media_urls?: string[];
    cta?: { kind: string; url?: string | null } | null;
    starts_at?: string | null;
    ends_at?: string | null;
  };
  'publication.changed': { publication_id: string; listing_id: string; state: Schema<'PublicationResult'>['state']; external_id?: string | null; url?: string | null; error?: string | null };
  'media.action.requested': { listing_media_id: string; listing_id: string; platform_id: string; action: Schema<'ListingMediaAction'>['action']; reason?: string | null; requested_by?: string | null; media_external_id?: string | null };
  'media.changed': { listing_media_id: string; state: Schema<'ListingMedia'>['state']; error?: string | null };
  'products.sync.requested': { batch_id: string; product_ids: string[]; requested_by?: string | null };
  'products.sync.requested.changed': { batch_id: string; product_id: string; synced: number; failed: number; done: boolean };
  'duplicate.action.requested': { case_id: string; listing_id: string; location_id: string | null; platform_id: string; action: Schema<'DuplicateAction'>['action']; note?: string | null; requested_by?: string | null };
  'duplicate.changed': { case_id: string; state: Schema<'DuplicateState'>; action?: string | null };
  'rank.run.requested': { project_id: string; run_id: string; requested_by?: string | null };
  'campaign.send.requested': { campaign_id: string; batch_id: string; recipients: number };
  'export.requested': { export_id: string; kind: string };
  'export.changed': { export_id: string; state: Schema<'ExportState'>; url?: string | null };
  'webhook.delivery.requested': { webhook_id: string; event: string; payload: Record<string, unknown> };

  // ── matching → core / sync ────────────────────────────────────────────────
  'listing.discovered': {
    listing_id: string;
    location_id: string | null;
    platform_id: string;
    platform_account_id?: string | null;
    external_id?: string | null;
    url?: string | null;
    match_state: Schema<'MatchState'>;
    sync_status: SyncStatus;
    ownership?: Schema<'Listing'>['ownership'];
    verification?: Schema<'Listing'>['verification'];
    observed_name?: string | null;
    observed_address?: string | null;
    score: number;
  };
  'listing.match.changed': { listing_id: string; from: Schema<'MatchState'>; to: Schema<'MatchState'>; location_id: string | null; external_id?: string | null };

  // ── sync-engine → core ────────────────────────────────────────────────────
  'listing.snapshot.captured': { listing_id: string; snapshot_id: string; observed_at: string; diff_summary: { field: CanonicalField | string; classification: 'IN_SYNC' | 'AWAITING_PLATFORM' | 'LOCAL_CHANGE' | 'REMOTE_DRIFT' | 'INITIAL_DIVERGENCE' | 'CONFLICT' }[]; rating?: number | null; review_count?: number | null };
  'listing.drift.detected': { listing_id: string; fields: (CanonicalField | string)[]; classification: 'moderation_normalization' | 'platform_edit' | 'owner_edit_in_cabinet' | 'unknown'; snapshot_id: string };
  'listing.status.changed': {
    listing_id: string;
    sync_status: SyncStatus;
    action_reason: ActionReason | null;
    match_state?: Schema<'MatchState'>;
    ownership?: Schema<'Listing'>['ownership'];
    verification?: Schema<'Listing'>['verification'];
    external_id?: string | null;
    url?: string | null;
    drift_fields?: (CanonicalField | string)[];
    snapshot_at?: string | null;
  };
  'sync.operation.changed': {
    operation_id: string;
    listing_id: string;
    location_id: string | null;
    platform_id: string;
    batch_id: string | null;
    state: OperationState;
    attempts: number;
    error: string | null;
    error_detail?: ConnectorErrorShape | null;
    patch?: CanonicalPatchEntry[] | { field: string }[];
    ticket_id?: string | null;
  };
  'review.ingested': {
    review_id: string;
    listing_id: string;
    location_id: string;
    platform_id: string;
    external_id: string | null;
    url?: string | null;
    author: Schema<'ReviewAuthor'>;
    rating: number | null;
    text: string | null;
    lang?: string | null;
    published_at: string;
    reply?: { text: string; published_at: string; external_id?: string | null } | null;
  };
  'review.updated': { review_id: string; rating: number | null; text: string | null; observed_at?: string; new_version?: number; fields?: string[] };
  'review.removed': { review_id: string; platform_state: Schema<'ReviewPlatformState'> };
  'question.ingested': { question_id: string; listing_id: string; location_id: string; platform_id: string; external_id: string; author: Schema<'ReviewAuthor'>; text: string; published_at: string };
  'media.ingested': { listing_media_id: string; listing_id: string; location_id: string; platform_id: string; external_id: string; url: string; thumbnail_url?: string | null; origin: 'owner' | 'user' | 'platform'; observed_at: string };

  // ── connector-runtime → core / sync ───────────────────────────────────────
  'connector.health.changed': { platform_id: string; capability: string; health: 'ok' | 'degraded' | 'down'; reason?: string | null };

  // ── stats / rank → core ───────────────────────────────────────────────────
  'metrics.ingested': { listing_ids: string[]; date_range: { from: string; to: string }; points?: { listing_id: string; metric: Schema<'Metric'>; date: string; value: number }[] };
  'rank.snapshot.captured': { project_id: string; run_id: string; cells?: { location_id: string; platform_id: string; keyword: string; lat: number; lng: number; rank: number | null; top_results: { external_id: string; name: string }[]; captured_at?: string }[] };
}

export type EventType = keyof EventData;

/** All event types, for stream subjects and validation. */
export const EVENT_TYPES = [
  'location.created',
  'location.changed',
  'location.deleted',
  'location.schedule.due',
  'sync.batch.requested',
  'listing.action.requested',
  'platform_account.check.requested',
  'platform_account.changed',
  'review.reply.requested',
  'review.reply.changed',
  'review.complaint.requested',
  'review.complaint.changed',
  'question.answer.requested',
  'question.answer.changed',
  'publication.requested',
  'publication.changed',
  'media.action.requested',
  'media.changed',
  'products.sync.requested',
  'products.sync.requested.changed',
  'duplicate.action.requested',
  'duplicate.changed',
  'rank.run.requested',
  'campaign.send.requested',
  'export.requested',
  'export.changed',
  'webhook.delivery.requested',
  'listing.discovered',
  'listing.match.changed',
  'listing.snapshot.captured',
  'listing.drift.detected',
  'listing.status.changed',
  'sync.operation.changed',
  'review.ingested',
  'review.updated',
  'review.removed',
  'question.ingested',
  'media.ingested',
  'connector.health.changed',
  'metrics.ingested',
  'rank.snapshot.captured'
] as const satisfies readonly EventType[];

/** Ordering key of an event (SDD-00 §7 guarantees). */
export function eventKey(e: EventEnvelope): string {
  const d = e.data as Record<string, unknown>;
  for (const k of ['listing_id', 'review_id', 'location_id', 'platform_account_id', 'batch_id', 'project_id']) {
    if (typeof d[k] === 'string') return `${k}:${d[k]}`;
  }
  return `tenant:${e.tenant_id}`;
}
