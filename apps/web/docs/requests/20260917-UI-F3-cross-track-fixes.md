# Shared changes made while building UI-F3 (cross-track)
- From: UI-F3 · To: UI-0 · Blocking: no · Date: 2026-09-17

## What
| Path | Owner | Change |
| --- | --- | --- |
| `mocks/server.ts`, `mocks/lib/ai-stream.ts` | UI-0 | Express route `POST /ai-replies/generate` with `Accept: text/event-stream` → AI SDK UI message stream (word by word, `MOCK_STREAM_WORD_MS`); JSON requests still go to the MSW handler. |
| `src/app/api/ai/reply/route.ts` | UI-F3 (new) | Route handler that proxies the stream from core-api and forwards the session cookie [H-UI-10]. |

## Why (screen / SDD ref)
S-REV-05 sandbox and the `AiReplyButton` stream (SDD-01 §5.2, H-UI-10).

## Proposed interface
Implemented — additive only.
