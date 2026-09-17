# @lp/contracts changelog

## 0.2.1-draft (2026-09-17)
- Job API: `listing.create` (create a card when discovery finds none; capability `listing.create`), SPI `listing.create?`.

## 0.2.0-draft (2026-09-17)
- Inter-service contracts added (SDD-00 §6–7, §11): `events/asyncapi.yaml` (41 event types with data schemas, producer/consumers/ordering key), `jobs/job-api.schema.json` (20 job kinds, payload/result per kind, `ConnectorError`), `src/events.ts` / `src/jobs.ts` / `src/spi.ts` (typed twins + Connector SPI). Events carry the data consumers need (`location.*` → canonical location, `platform_account.*` → account descriptor) because services never read each other's databases.
Reviewed against the core-api implementation (lp-core); all UI change requests of 2026-09-17 accepted:
- `GET /taxonomy/categories` (paged, `q`, `platform_id`) and `GET /taxonomy/attributes`; schemas `TaxonomyCategory`, `TaxonomyAttribute`.
- `LocationPatch` (all fields optional) — `LocationBulkRequest.patch` uses it; `LocationCore` keeps the same property list.
- `POST /me/2fa/enrol` → `TwoFactorEnrolment`, `POST /me/2fa/confirm`, `DELETE /me/2fa` (`TwoFactorCode`).
- `POST /me/email` (202, confirmation link) and `POST /me/email/confirm` → `User`.
- `GET /notifications` `filter[type]`; `NotificationType` extracted as a schema.
- `PublicationCreate.state`: `draft | scheduled | publish` (default publish).
- `SyncBatch.kind` += `products`, `campaign_send`.
- `POST /media` multipart body documented as `MediaUpload` (`file`, `kind`, `location_ids` — repeated or comma-separated).
- `WidgetConfig` typed (`theme`, `min_rating`, `platforms`, `limit`, `default_city`, `show_hours`; extra keys allowed) for `Widget.config` / `WidgetUpsert.config`.
- 147 paths / 207 operations.

## 0.1.0-draft (2026-09-16)
- First draft of the core-api OpenAPI 3.1 document authored from SDD-00 §3–§8 by the UI track. 140 paths / 200 operations. Not yet reviewed by the core-api owner; not frozen.
