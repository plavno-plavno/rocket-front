# UI-F5 — Content

Волна 2. Ветка `ui/UI-F5/<slug>`, worktree `pnpm wt:new UI-F5 <slug>` (порты web 3108, mock 4108).

## Что делает трек
S-PUB-01 публикации, S-MED-01 менеджер фото (свои / UGC), S-PRD-01 товары и цены, S-DUP-01 дубли и фейки (очередь + детали со сравнением полей)

## Публичный API трека (SDD-01T §3.5)
—

## Потребляет
DS, F1

## Фичи и пути
- `features/publications` — экраны S-PUB-01; API-теги publications
- `features/media` — экраны S-MED-01; API-теги media
- `features/products` — экраны S-PRD-01; API-теги products
- `features/duplicates` — экраны S-DUP-01; API-теги duplicates

Точные globs владения — `apps/web/tracks.json` (`UI-F5`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F5 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F5/apps/web && pnpm wt:dev`.
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
Готово, ветка `ui/UI-F5/content`, влита в main. Подробности — `docs/CHANGELOG.md` («UI-F5 — Content»), cross-track — `docs/requests/20260917-UI-F5-cross-track-fixes.md`, запросы к контракту — `packages/contracts/CHANGE_REQUESTS.md` (черновики публикаций, `SyncBatch.kind: products`). Фото из библиотеки (внешние URL) не входят в визуальные эталоны — страница «Менеджер фото» проверяется функциональным e2e.
