/**
 * Job API to the connector-runtime (SDD-00 §6). Every call to a platform is an
 * asynchronous job: the caller (sync-engine, matching, stats, rank) builds a
 * `JobRequest`, the runtime answers with a `JobResult`. JSON Schema of the same
 * shapes: `jobs/job-api.schema.json` (validated by the runtime and the harness).
 */
import type { Schema } from './index';

export type JobKind =
  | 'account.check'
  | 'listing.discover'
  | 'listing.fetch'
  | 'listing.push'
  | 'listing.create'
  | 'operation.poll'
  | 'reviews.list'
  | 'review.reply'
  | 'review.reply.delete'
  | 'review.complain'
  | 'questions.list'
  | 'question.answer'
  | 'media.list'
  | 'media.upload'
  | 'media.delete'
  | 'media.flag'
  | 'publication.create'
  | 'publication.delete'
  | 'metrics.fetch'
  | 'keywords.fetch'
  | 'rank.search';

export type JobPriority = 'interactive' | 'high' | 'normal' | 'background';
export type AccessMethod = 'api' | 'feed' | 'browser' | 'public' | 'manual';

/** Canonical field paths a platform can accept (SDD-00 §4, SDD-03 §5.1). */
export type CanonicalField =
  | 'name'
  | 'status'
  | 'address'
  | 'geo'
  | 'phones'
  | 'emails'
  | 'website'
  | 'social'
  | 'hours.regular'
  | 'hours.special'
  | 'categories'
  | 'attributes'
  | 'description'
  | 'media.logo'
  | 'media.cover'
  | 'media.gallery';

export interface ListingRef {
  listing_id: string;
  external_id?: string | null;
  url?: string | null;
}

export interface ReviewRef {
  review_id: string;
  external_id: string;
  listing: ListingRef;
}

/** A field-level change to apply on the platform (`from` is what we last observed). */
export interface CanonicalPatchEntry {
  field: CanonicalField;
  from?: unknown;
  to: unknown;
}

export interface ListingCandidate {
  external_id: string;
  url?: string | null;
  name: string;
  address?: string | null;
  geo?: Schema<'Geo'> | null;
  phones?: string[];
  website?: string | null;
  categories?: string[];
  rating?: number | null;
  review_count?: number | null;
  ownership?: Schema<'ListingOwnership'>;
  verification?: Schema<'ListingVerification'>;
  status?: 'open' | 'closed' | 'suspended';
}

export interface CanonicalListingSnapshot extends ListingCandidate {
  snapshot_id: string;
  observed_at: string;
  /** Canonical projection of what the platform shows (partial: only fields the platform exposes). */
  fields: Partial<Schema<'LocationCore'>>;
  /** Raw platform payload reference (evidence store). */
  evidence_ref?: string | null;
}

export interface CanonicalReview {
  external_id: string;
  url?: string | null;
  author: Schema<'ReviewAuthor'>;
  rating: number | null;
  text: string | null;
  lang?: string | null;
  published_at: string;
  edited_at?: string | null;
  platform_state?: Schema<'ReviewPlatformState'>;
  reply?: { external_id?: string | null; text: string; published_at: string } | null;
}

export interface CanonicalQuestion {
  external_id: string;
  author: Schema<'ReviewAuthor'>;
  text: string;
  published_at: string;
  answers: { external_id?: string | null; text: string; published_at: string; by_owner: boolean }[];
}

export interface CanonicalMediaItem {
  external_id: string;
  url: string;
  thumbnail_url?: string | null;
  kind: Schema<'MediaKind'>;
  origin: 'owner' | 'user' | 'platform';
  published_at?: string | null;
}

export interface MetricSeries {
  metric: Schema<'Metric'>;
  points: { date: string; value: number }[];
}

export interface KeywordImpressions {
  keyword: string;
  impressions: number;
}

export interface RankGridCell {
  lat: number;
  lng: number;
  rank: number | null;
  top_results: { external_id: string; name: string }[];
}

export interface PushTicket {
  /** Platform-side operation/edit id, when the platform gives one. */
  ticket_id: string;
  state: 'applied' | 'pending_moderation';
  /** Fields the platform accepted as-is, and fields it normalised (observed value differs from pushed). */
  applied_fields?: CanonicalField[];
  normalized?: { field: CanonicalField; pushed: unknown; observed: unknown }[];
}

export interface OperationStatus {
  ticket_id: string;
  state: 'pending_moderation' | 'confirmed' | 'rejected';
  rejected?: { field?: CanonicalField | null; platform_message?: string | null; reason_code?: string | null } | null;
}

/** Per-kind job payloads (`jobs/job-api.schema.json#/$defs/payloads`). */
export interface JobPayload {
  'account.check': { platform_account_id: string };
  'listing.discover': {
    name: string;
    address?: string | null;
    geo?: Schema<'Geo'> | null;
    phones?: string[];
    website?: string | null;
    branch_code?: string | null;
    limit?: number;
  };
  'listing.fetch': Record<string, never>;
  'listing.push': { patch: CanonicalPatchEntry[]; desired: Partial<Schema<'LocationCore'>>; operation_id: string };
  /** Creates the card on the platform (capability `listing.create`, SDD-05 §3.1) when discovery found none. */
  'listing.create': { operation_id: string; desired: Partial<Schema<'LocationCore'>> };
  'operation.poll': { ticket_id: string };
  'reviews.list': { since?: string | null; until?: string | null; cursor?: string | null; limit?: number; include_edits?: boolean };
  'review.reply': { review: ReviewRef; text: string; reply_id: string };
  'review.reply.delete': { review: ReviewRef; reply_external_id?: string | null };
  'review.complain': { review: ReviewRef; reason_code: string; text?: string | null; complaint_id: string };
  'questions.list': { since?: string | null; cursor?: string | null; limit?: number };
  'question.answer': { question_external_id: string; text: string; answer_id: string };
  'media.list': { cursor?: string | null; limit?: number };
  'media.upload': { media_id: string; url: string; kind: Schema<'MediaKind'>; caption?: string | null };
  'media.delete': { media_external_id: string };
  'media.flag': { media_external_id: string; reason?: string | null };
  'publication.create': {
    publication_id: string;
    type: Schema<'PublicationType'>;
    title?: string | null;
    text: string;
    media_urls: string[];
    cta?: { kind: string; url?: string | null } | null;
    starts_at?: string | null;
    ends_at?: string | null;
  };
  'publication.delete': { publication_external_id: string };
  'metrics.fetch': { from: string; to: string; metrics: Schema<'Metric'>[] };
  'keywords.fetch': { month: string };
  'rank.search': { keyword: string; lat: number; lng: number; grid: { size: number; radius_m: number }; target_external_id: string };
}

/** Per-kind job results (`jobs/job-api.schema.json#/$defs/results`). */
export interface JobResultData {
  'account.check': { health: 'ok' | 'reauth_required' | 'challenge_required' | 'revoked'; display_name?: string | null; expires_at?: string | null };
  'listing.discover': { items: ListingCandidate[]; next_cursor?: string | null };
  'listing.fetch': CanonicalListingSnapshot;
  'listing.push': PushTicket;
  'listing.create': { external_id: string; url?: string | null; state: 'created' | 'pending_moderation'; ticket_id?: string | null; verification?: Schema<'ListingVerification'> };
  'operation.poll': OperationStatus;
  'reviews.list': { items: CanonicalReview[]; next_cursor?: string | null; window_complete: boolean };
  'review.reply': { external_id?: string | null; published_at: string };
  'review.reply.delete': Record<string, never>;
  'review.complain': { external_id?: string | null; submitted_at: string };
  'questions.list': { items: CanonicalQuestion[]; next_cursor?: string | null };
  'question.answer': { external_id?: string | null; published_at: string };
  'media.list': { items: CanonicalMediaItem[]; next_cursor?: string | null };
  'media.upload': { external_id: string; url?: string | null };
  'media.delete': Record<string, never>;
  'media.flag': Record<string, never>;
  'publication.create': { external_id: string; url?: string | null; state: 'published' | 'pending_moderation' };
  'publication.delete': Record<string, never>;
  'metrics.fetch': { series: MetricSeries[] };
  'keywords.fetch': { items: KeywordImpressions[] };
  'rank.search': { cells: RankGridCell[]; captured_at: string };
}

export interface JobRequest<K extends JobKind = JobKind> {
  /** Idempotency key chosen by the caller. */
  job_id: string;
  kind: K;
  tenant_id: string;
  platform_id: string;
  platform_account_id?: string | null;
  listing_ref?: ListingRef | null;
  payload: JobPayload[K];
  priority: JobPriority;
  /** ISO timestamp; the runtime cancels the job after it. */
  deadline?: string | null;
  trace_id: string;
}

export type ConnectorErrorCode =
  | 'AUTH_EXPIRED'
  | 'CHALLENGE_REQUIRED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'VALIDATION_REJECTED'
  | 'MODERATION_PENDING'
  | 'CAPABILITY_UNAVAILABLE'
  | 'PLATFORM_CHANGED'
  | 'TRANSIENT'
  | 'FORBIDDEN_BY_POLICY';

export interface ConnectorErrorShape {
  code: ConnectorErrorCode;
  message: string;
  /** For RATE_LIMITED. */
  retry_after_s?: number | null;
  /** For VALIDATION_REJECTED. */
  field?: CanonicalField | string | null;
  platform_message?: string | null;
  /** For MODERATION_PENDING: what to poll. */
  ticket_id?: string | null;
  evidence_ref?: string | null;
}

/** Which codes the caller may retry (SDD-00 §6.3). */
export const CONNECTOR_ERROR_RETRY: Record<ConnectorErrorCode, 'no' | 'after' | 'backoff' | 'poll'> = {
  AUTH_EXPIRED: 'no',
  CHALLENGE_REQUIRED: 'no',
  RATE_LIMITED: 'after',
  NOT_FOUND: 'no',
  VALIDATION_REJECTED: 'no',
  MODERATION_PENDING: 'poll',
  CAPABILITY_UNAVAILABLE: 'no',
  PLATFORM_CHANGED: 'no',
  TRANSIENT: 'backoff',
  FORBIDDEN_BY_POLICY: 'no'
};

/** The only error a plugin may throw (SDD-05 §4). */
export class ConnectorError extends Error implements ConnectorErrorShape {
  readonly code: ConnectorErrorCode;
  readonly retry_after_s?: number | null;
  readonly field?: string | null;
  readonly platform_message?: string | null;
  readonly ticket_id?: string | null;
  readonly evidence_ref?: string | null;

  constructor(code: ConnectorErrorCode, message: string, extra: Omit<ConnectorErrorShape, 'code' | 'message'> = {}) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    Object.assign(this, extra);
  }

  toJSON(): ConnectorErrorShape {
    return {
      code: this.code,
      message: this.message,
      retry_after_s: this.retry_after_s ?? null,
      field: this.field ?? null,
      platform_message: this.platform_message ?? null,
      ticket_id: this.ticket_id ?? null,
      evidence_ref: this.evidence_ref ?? null
    };
  }

  static is(e: unknown): e is ConnectorError {
    return e instanceof ConnectorError || (typeof e === 'object' && e !== null && (e as any).name === 'ConnectorError');
  }
}

export interface JobResult<K extends JobKind = JobKind> {
  job_id: string;
  status: 'succeeded' | 'failed' | 'deferred';
  data?: JobResultData[K];
  error?: ConnectorErrorShape;
  method: AccessMethod;
  cost?: { requests: number; browser_seconds?: number };
  finished_at: string;
  evidence_ref?: string | null;
}

/** Temporal task queue of a platform (SDD-00 §6.1). */
export const connectorTaskQueue = (platformId: string): string => `connector.${platformId}`;
