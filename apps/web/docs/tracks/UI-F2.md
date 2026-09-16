# UI-F2 — Reviews Inbox

Волна 1. Ветка `ui/UI-F2/<slug>`, worktree `pnpm wt:new UI-F2 <slug>` (порты web 3104, mock 4104).

## Что делает трек
S-REV-01 инбокс отзывов (InboxPage: список | детали | фильтры, KPI, композер с `TemplatePicker` / `AiReplyButton`, жалобы, заметки, история, `j/k r t a`, плашка «N новых» через `useRealtime()`), S-QA-01 вопросы

## Публичный API трека (SDD-01T §3.5)
`ReviewDrawer` (полные детали), `RecentReviewsList`

## Потребляет
DS, F3 (`TemplatePicker`, `TagPicker`, `AiReplyButton`), F7 (`UserCombobox`), F1 (`LocationStatusStack`)

## Фичи и пути
- `features/reviews` — экраны S-REV-01; API-теги reviews
- `features/questions` — экраны S-QA-01; API-теги questions

Точные globs владения — `apps/web/tracks.json` (`UI-F2`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F2 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F2/apps/web && pnpm wt:dev`.
2. Прочитать `AGENTS.md` (раздел «Project rules (LP)»), `docs/UX_WRITING.md`, SDD-01 §8–9 для своих экранов.
3. В `feature.ts` поставить `status: 'wip'` первым PR; добавлять экраны, заменяя `PlannedPage` шаблоном страницы (`ListPage` / `DetailPage` / `AnalyticsPage` / `InboxPage` / `SettingsPage` / `WizardPage`).
4. Данные — только через `api/*` фичи (сгенерированы `scaffold:api`, дорабатывать можно); моки — `mocks/handlers.ts` (Foundation уже дал базовые для большинства эндпоинтов — см. `pnpm mock:api` и 501-ответы для недостающих).
5. Переводы — `messages/{ru,en}.json`; `pnpm gen --check` должен быть зелёным.
6. e2e — `e2e/*.spec.ts` в фиче (`pnpm e2e`), визуальные эталоны через `toHaveScreenshot`.

## Definition of Done (SDD-01T §8)
- [ ] Все экраны трека используют шаблоны страниц и работают против mock core-api.
- [ ] Публичный API реализован полностью, props изменены только аддитивно.
- [ ] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [ ] e2e трека и визуальные эталоны (1440px светлая/тёмная, 390px для инбокса).
- [ ] Нет `_local`-компонентов и открытых блокирующих запросов.
- [ ] `feature.ts` → `status: 'ready'`.
