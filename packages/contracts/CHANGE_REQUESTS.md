# Contract change requests

UI tracks that need an endpoint or field missing from `openapi/core-api.yaml` add an entry here (SDD-01T §5.5) and mark the corresponding mock handler `provisional: true` until the request is accepted.

| Date | Track | Request | Status |
|---|---|---|---|
| 2026-09-17 | UI-F1 | **Taxonomy endpoint.** S-LOC-03 needs the list of categories (id → localized name, per platform mapping) and attribute keys. Proposed `GET /taxonomy/categories?q=&platform_id=` (paginated, `{ id, name, parent_id, platform_ids[] }`) and `GET /taxonomy/attributes` (`{ key, name, kind: boolean|enum, values[] }`). UI ships a static list in `features/locations/constants/taxonomy.ts` until then. | open |
| 2026-09-17 | UI-F1 | **`LocationBulkRequest.patch` should be a partial.** It references `LocationCore` (required `name`, `status`, `address`), but bulk edit sends only the changed fields (`status`, `website`, `description`). Proposed: `patch: { allOf: [LocationCore], required: [] }` or a dedicated `LocationPatch`. UI casts for now (`bulk-edit-sheet.tsx`). | open |
| 2026-09-17 | UI-F1 | **`ImportUploadResponse.row_count`.** The mapping step shows «строк — N»; the contract exposes only `sample_rows`. Proposed optional `row_count: integer`. UI falls back to `sample_rows.length`. | open |
