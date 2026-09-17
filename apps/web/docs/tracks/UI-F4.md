# UI-F4 — Analytics

Волна 2. Ветка `ui/UI-F4/<slug>`, worktree `pnpm wt:new UI-F4 <slug>` (порты web 3107, mock 4107).

## Что делает трек
S-ANL-01…08 анализ отзывов (AnalyticsPage, `PeriodPicker` с compare, `RegionChoropleth`, `DistributionCard`, рейтинги, сотрудники, темы, `KwicTable`), S-PRS-01 онлайн-присутствие (+ sync, platform/[platformId], keywords), S-RNK-01 трекер позиций (`RankHeatmap`)

## Публичный API трека (SDD-01T §3.5)
`ReviewsTrendCard`, `PresenceTrendCard`

## Потребляет
DS, F3 (`TagPicker`), F7 (`UserCombobox`), F2 (`ReviewDrawer`)

## Фичи и пути
- `features/review-analytics` — экраны S-ANL-01, S-ANL-02, S-ANL-03, S-ANL-04, S-ANL-05, S-ANL-06, S-ANL-07, S-ANL-08; API-теги review-analytics
- `features/presence` — экраны S-PRS-01; API-теги presence
- `features/rank` — экраны S-RNK-01; API-теги rank

Точные globs владения — `apps/web/tracks.json` (`UI-F4`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F4 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F4/apps/web && pnpm wt:dev`.
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
Готово, ветка `ui/UI-F4/analytics`, влита в main. Подробности — `docs/CHANGELOG.md` («UI-F4 — Analytics»), cross-track — `docs/requests/20260917-UI-F4-cross-track-fixes.md`. Тепловая карта позиций рендерится сеткой; MapLibre-режим включается `NEXT_PUBLIC_MAP_STYLE_URL` (UI-DS).
