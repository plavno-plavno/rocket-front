/**
 * Connector SPI (SDD-05 §4) — the contract every platform plugin implements and
 * the connector-runtime drives. Plugins are stateless: sessions live in the
 * runtime, cursors with the caller. A plugin throws only `ConnectorError`.
 */
import type { Schema } from './index';
import type {
  AccessMethod,
  CanonicalField,
  CanonicalListingSnapshot,
  CanonicalMediaItem,
  CanonicalPatchEntry,
  CanonicalQuestion,
  CanonicalReview,
  KeywordImpressions,
  ListingCandidate,
  ListingRef,
  MetricSeries,
  OperationStatus,
  PushTicket,
  RankGridCell,
  ReviewRef
} from './jobs';

// ── manifest (SDD-05 §3.1) ───────────────────────────────────────────────────

export interface PlatformCapabilities {
  listing?: {
    read: AccessMethod[];
    write: AccessMethod[];
    create: AccessMethod[];
    fields_writable: CanonicalField[];
    moderation: 'none' | 'async' | 'manual';
  };
  reviews?: {
    read: AccessMethod[];
    reply: AccessMethod[];
    delete_reply: AccessMethod[];
    complain: AccessMethod[];
    edits_visible: boolean;
    push_notifications: boolean;
  };
  questions?: { read: AccessMethod[]; answer: AccessMethod[] };
  media?: { read: AccessMethod[]; upload: AccessMethod[]; delete: AccessMethod[] };
  publications?: { create: AccessMethod[]; types: string[] };
  metrics?: { metrics: Schema<'Metric'>[]; granularity: 'day' | 'month'; latency_days: number };
  rank?: { method: AccessMethod; max_results: number };
  limits: { per_listing_edits_per_min?: number; per_account_rpm?: number; global_rpm?: number };
}

export type PluginStatus = 'hypothesis' | 'experimental' | 'production';

export interface Manifest {
  id: string;
  version: string;
  platform: { name: string; kind: Schema<'PlatformKind'>; countries: string[] };
  auth: {
    kind: Schema<'PlatformAccountAuthKind'>;
    scopes?: string[];
    session_ttl_hint_h?: number;
  };
  capabilities: PlatformCapabilities;
  limits?: { global_rpm?: number; per_account_rpm?: number; per_listing_edits_per_min?: number };
  sla?: {
    expected_moderation?: { p50_min: number; p90_min: number };
    freshness_target_min?: { reviews?: number; listing?: number };
  };
  compliance: {
    tos_reviewed: boolean;
    tos_ref?: string | null;
    allowed_methods_by_legal: AccessMethod[];
  };
  health?: {
    canary_interval_min?: number;
    degraded_if?: { error_rate_5m?: number; extract_anomaly?: boolean };
  };
  status: PluginStatus;
}

// ── runtime context handed to a plugin call ─────────────────────────────────

export interface RateLimitedHttp {
  /** `fetch` that waits for a token of the account / platform bucket and honours Retry-After. */
  fetch(input: string, init?: RequestInit & { bucket?: 'account' | 'listing' | 'global' }): Promise<Response>;
  json<T = unknown>(input: string, init?: RequestInit): Promise<T>;
}

export interface BrowserSessionLease {
  /** Playwright page bound to the account's storage state; released by the runtime. */
  page: unknown;
  storageStateRef: string;
  release(): Promise<void>;
}

export interface SecretReader {
  /** Secrets of the job's account only (audit-logged by the runtime). */
  get(name: string): Promise<string | null>;
  all(): Promise<Record<string, string>>;
}

export interface EvidenceWriter {
  write(kind: 'response' | 'html' | 'screenshot' | 'har' | 'note', body: string | Uint8Array, meta?: Record<string, unknown>): Promise<string>;
}

export interface PluginLogger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

export interface Ctx {
  job_id: string;
  tenant_id: string;
  platform_id: string;
  platform_account_id?: string | null;
  trace_id: string;
  http: RateLimitedHttp;
  browser?: BrowserSessionLease;
  secrets: SecretReader;
  evidence: EvidenceWriter;
  log: PluginLogger;
  clock: { now(): Date };
  signal: AbortSignal;
  /** Base URL of the platform (simulator or real), from runtime config. */
  base_url: string;
}

// ── SPI ─────────────────────────────────────────────────────────────────────

export interface ConnectInput {
  auth_kind: Schema<'PlatformAccountAuthKind'>;
  display_name?: string | null;
  credentials?: Record<string, string>;
  redirect_uri?: string;
}

export type ConnectStep =
  | { kind: 'redirect'; url: string; state: string }
  | { kind: 'form'; fields: { name: string; label: string; secret: boolean }[] }
  | { kind: 'done'; account: AccountRef };

export interface AccountRef {
  external_account_id: string;
  display_name?: string | null;
  /** Secrets to store in the vault (never returned to core-api). */
  secrets?: Record<string, string>;
  expires_at?: string | null;
}

export type AccountHealth = 'ok' | 'reauth_required' | 'challenge_required' | 'revoked';

export interface DiscoverQuery {
  name: string;
  address?: string | null;
  geo?: Schema<'Geo'> | null;
  phones?: string[];
  website?: string | null;
  branch_code?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  next_cursor?: string | null;
}

export interface ReviewWindow {
  since?: string | null;
  until?: string | null;
  cursor?: string | null;
  limit?: number;
  include_edits?: boolean;
}

export interface CanonicalPatch {
  operation_id: string;
  entries: CanonicalPatchEntry[];
  desired: Partial<Schema<'LocationCore'>>;
}

export interface ReplyResult {
  external_id?: string | null;
  published_at: string;
}

export interface ComplaintResult {
  external_id?: string | null;
  submitted_at: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface RankQuery {
  keyword: string;
  lat: number;
  lng: number;
  grid: { size: number; radius_m: number };
  target_external_id: string;
}

export interface RankResult {
  cells: RankGridCell[];
  captured_at: string;
}

export interface ConnectorPlugin {
  manifest: Manifest;
  auth: {
    beginConnect(ctx: Ctx, input: ConnectInput): Promise<ConnectStep>;
    completeConnect(ctx: Ctx, input: unknown): Promise<AccountRef>;
    check(ctx: Ctx, acc: { external_account_id: string }): Promise<AccountHealth>;
  };
  listing?: {
    discover(ctx: Ctx, q: DiscoverQuery): Promise<Page<ListingCandidate>>;
    fetch(ctx: Ctx, ref: ListingRef): Promise<CanonicalListingSnapshot>;
    push(ctx: Ctx, ref: ListingRef, patch: CanonicalPatch): Promise<PushTicket>;
    /** Only when the manifest declares `listing.create` with a non-manual method. */
    create?(ctx: Ctx, input: { operation_id: string; desired: Partial<Schema<'LocationCore'>> }): Promise<{ external_id: string; url?: string | null; state: 'created' | 'pending_moderation'; ticket_id?: string | null; verification?: Schema<'ListingVerification'> }>;
    pollOperation?(ctx: Ctx, ticket: { ticket_id: string }): Promise<OperationStatus>;
  };
  reviews?: {
    list(ctx: Ctx, ref: ListingRef, window: ReviewWindow): Promise<Page<CanonicalReview> & { window_complete: boolean }>;
    reply?(ctx: Ctx, ref: ReviewRef, text: string): Promise<ReplyResult>;
    deleteReply?(ctx: Ctx, ref: ReviewRef): Promise<void>;
    complain?(ctx: Ctx, ref: ReviewRef, reason: string, text?: string | null): Promise<ComplaintResult>;
  };
  questions?: {
    list(ctx: Ctx, ref: ListingRef, window: { since?: string | null; cursor?: string | null; limit?: number }): Promise<Page<CanonicalQuestion>>;
    answer(ctx: Ctx, ref: ListingRef, questionExternalId: string, text: string): Promise<ReplyResult>;
  };
  media?: {
    list(ctx: Ctx, ref: ListingRef, window: { cursor?: string | null; limit?: number }): Promise<Page<CanonicalMediaItem>>;
    upload(ctx: Ctx, ref: ListingRef, item: { url: string; kind: Schema<'MediaKind'>; caption?: string | null }): Promise<{ external_id: string; url?: string | null }>;
    remove(ctx: Ctx, ref: ListingRef, externalId: string): Promise<void>;
    flag?(ctx: Ctx, ref: ListingRef, externalId: string, reason?: string | null): Promise<void>;
  };
  publications?: {
    create(
      ctx: Ctx,
      ref: ListingRef,
      post: { type: Schema<'PublicationType'>; title?: string | null; text: string; media_urls: string[]; cta?: { kind: string; url?: string | null } | null; starts_at?: string | null; ends_at?: string | null }
    ): Promise<{ external_id: string; url?: string | null; state: 'published' | 'pending_moderation' }>;
    remove(ctx: Ctx, ref: ListingRef, externalId: string): Promise<void>;
  };
  metrics?: {
    fetch(ctx: Ctx, ref: ListingRef, range: DateRange, metrics: Schema<'Metric'>[]): Promise<MetricSeries[]>;
    keywords?(ctx: Ctx, ref: ListingRef, month: string): Promise<KeywordImpressions[]>;
  };
  rank?: {
    search(ctx: Ctx, q: RankQuery): Promise<RankResult>;
  };
}

/** Identity helper so a plugin's `index.ts` reads `export default definePlugin({...})`. */
export function definePlugin(plugin: ConnectorPlugin): ConnectorPlugin {
  return plugin;
}
