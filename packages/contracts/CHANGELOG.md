# @lp/contracts changelog

## 0.2.0-draft (2026-09-17)
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
