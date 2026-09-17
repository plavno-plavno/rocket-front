# Contract change requests

UI tracks that need an endpoint or field missing from `openapi/core-api.yaml` add an entry here (SDD-01T §5.5) and mark the corresponding mock handler `provisional: true` until the request is accepted.

| Date | Track | Request | Status |
|---|---|---|---|
| 2026-09-17 | UI-F1 | **Taxonomy endpoint.** S-LOC-03 needs the list of categories (id → localized name, per platform mapping) and attribute keys. Proposed `GET /taxonomy/categories?q=&platform_id=` (paginated, `{ id, name, parent_id, platform_ids[] }`) and `GET /taxonomy/attributes` (`{ key, name, kind: boolean|enum, values[] }`). UI ships a static list in `features/locations/constants/taxonomy.ts` until then. | open |
| 2026-09-17 | UI-F1 | **`LocationBulkRequest.patch` should be a partial.** It references `LocationCore` (required `name`, `status`, `address`), but bulk edit sends only the changed fields (`status`, `website`, `description`). Proposed: `patch: { allOf: [LocationCore], required: [] }` or a dedicated `LocationPatch`. UI casts for now (`bulk-edit-sheet.tsx`). | open |
| 2026-09-17 | UI-F1 | **`ImportUploadResponse.row_count`.** The mapping step shows «строк — N»; the contract exposes only `sample_rows`. Proposed optional `row_count: integer`. UI falls back to `sample_rows.length`. | open |
| 2026-09-17 | UI-F7 | **Two-factor toggle.** S-SET-02 shows `User.two_factor_enabled` but there is no endpoint to enrol / disable an authenticator. Proposed `POST /me/2fa/enrol` → `{ otpauth_url, secret }`, `POST /me/2fa/confirm { code }`, `DELETE /me/2fa { code }`. UI shows status only until then. | open |
| 2026-09-17 | UI-F7 | **`GET /notifications` `filter[type]`.** The notifications page wants to filter by `Notification.type` (negative_review, action_required, …); the contract only has `filter[unread]`. Proposed optional `filter[type]` (array). UI shows type icons and the «Непрочитанные» tab only. | open |
| 2026-09-17 | UI-F7 | **Change own email.** `ProfileUpdate` has `name`, `locale`, `avatar_url` — no email change (with confirmation). Proposed `POST /me/email { email }` → 202 + confirmation link. Profile shows email read-only with a hint. | open |
| 2026-09-17 | UI-F5 | **Publication drafts.** `PublicationCreate` has no way to save a draft (`state` is server-owned, `Publication.state` includes `draft`). Proposed optional `PublicationCreate.state: draft | scheduled | publish` (default `publish`). UI edits seeded drafts through `PUT` and publishes them; «Сохранить черновик» is hidden until then. | open |
| 2026-09-17 | UI-F5 | **`SyncBatch.kind` for the catalogue.** `POST /products/sync` returns a `SyncBatch`, but `kind` enum has no product value. Proposed `products`. Mock uses `schedule`. | open |
| 2026-09-17 | UI-F5 | **`MediaAsset` upload params.** `POST /media` (multipart) has no documented fields besides `file`; UI sends `kind` and `location_ids` (comma-separated). Proposed to document them in the request schema. | open |
