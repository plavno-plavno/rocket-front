# UI-F6 — Engagement

Волна 3. Ветка `ui/UI-F6/<slug>`, worktree `pnpm wt:new UI-F6 <slug>` (порты web 3110, mock 4110).

## Что делает трек
S-GEN-01 генерация отзывов (кампании, QR PDF, воронка; routing без review gating — SDD-00 §3.10), S-WID-01 виджеты, сторлокатор (Beta), S-COM-01 коммуникация (мультичат на базе `features/_reference/chat`) [H-UI-05]

## Публичный API трека (SDD-01T §3.5)
—

## Потребляет
DS, F1, F3

## Фичи и пути
- `features/review-generation` — экраны S-GEN-01; API-теги review-generation
- `features/communication` — экраны S-COM-01; API-теги questions
- `features/store-locator` — экраны S-WID-01; API-теги widgets
- `features/widgets` — экраны S-WID-01; API-теги widgets

Точные globs владения — `apps/web/tracks.json` (`UI-F6`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F6 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F6/apps/web && pnpm wt:dev`.
2. Прочитать `AGENTS.md` (раздел «Project rules (LP)»), `docs/UX_WRITING.md`, SDD-01 §8–9 для своих экранов.
3. В `feature.ts` поставить `status: 'wip'` первым PR; добавлять экраны, заменяя `PlannedPage` шаблоном страницы (`ListPage` / `DetailPage` / `AnalyticsPage` / `InboxPage` / `SettingsPage` / `WizardPage`).
4. Данные — только через `api/*` фичи (сгенерированы `scaffold:api`, дорабатывать можно); моки — `mocks/handlers.ts` (Foundation уже дал базовые для большинства эндпоинтов — см. `pnpm mock:api` и 501-ответы для недостающих).
5. Переводы — `messages/{ru,en}.json`; `pnpm gen --check` должен быть зелёным.
6. e2e — `e2e/*.spec.ts` в фиче (`pnpm e2e`), визуальные эталоны через `toHaveScreenshot`.

## Definition of Done (SDD-01T §8)
- [x] Все экраны трека используют шаблоны страниц и работают против mock core-api.
- [x] Публичный API реализован полностью, props изменены только аддитивно.
- [x] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [x] e2e трека и визуальные эталоны (1440px светлая/тёмная, 390px для инбокса).
- [x] Нет `_local`-компонентов и открытых блокирующих запросов.
- [x] `feature.ts` → `status: 'ready'`.

## Статус (2026-09-17)
Готово, ветка `ui/UI-F6/engagement`, влита в main. Подробности — `docs/CHANGELOG.md` («UI-F6 — Engagement»), cross-track — `docs/requests/20260917-UI-F6-cross-track-fixes.md`, запросы к контракту — `packages/contracts/CHANGE_REQUESTS.md` (`SyncBatch.kind: campaign_send`, конфиг виджетов). Мультичат построен на `InboxPage` (как инбоксы F2), а не на `features/_reference/chat`.
