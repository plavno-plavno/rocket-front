# UI-F1 — Locations & Sources

Волна 1. Ветка `ui/UI-F1/<slug>`, worktree `pnpm wt:new UI-F1 <slug>` (порты web 3103, mock 4103).

## Что делает трек
S-LOC-01 (доделать: bulk-действия, колонки по [H-UI-03]), S-LOC-02 импорт-визард, S-LOC-03 карточка компании (Данные / Площадки / История / Отзывы), S-SRC-01 источники [H-UI-09]

## Публичный API трека (SDD-01T §3.5)
`LocationPicker` (заменить заглушку на DataTable + дерево), `LocationStatusStack`, `ActionRequiredList`

## Потребляет
DS, F2 (`ReviewDrawer` на вкладке «Отзывы»)

## Фичи и пути
- `features/locations` — экраны —; API-теги locations
- `features/listings` — экраны —; API-теги listings
- `features/sources` — экраны —; API-теги sources, platforms

Точные globs владения — `apps/web/tracks.json` (`UI-F1`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F1 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F1/apps/web && pnpm wt:dev`.
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
