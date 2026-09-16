# UI-DS — Design System

Волна 1. Ветка `ui/UI-DS/<slug>`, worktree `pnpm wt:new UI-DS <slug>` (порты web 3102, mock 4102).

## Что делает трек
`/dashboard/dev/components` — витрина всех `components/lp` и shadcn-примитивов, тема `lp`, плотность таблиц, виртуализация, брендовые SVG площадок, замена tile-map на d3-geo (RegionChoropleth) и MapLibre (RankHeatmap)

## Публичный API трека (SDD-01T §3.5)
`components/lp/*`, шаблоны страниц

## Потребляет
—

## Фичи и пути
- —

Точные globs владения — `apps/web/tracks.json` (`UI-DS`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-DS <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-DS/apps/web && pnpm wt:dev`.
2. Прочитать `AGENTS.md` (раздел «Project rules (LP)»), `docs/UX_WRITING.md`, SDD-01 §8–9 для своих экранов.
3. В `feature.ts` поставить `status: 'wip'` первым PR; добавлять экраны, заменяя `PlannedPage` шаблоном страницы (`ListPage` / `DetailPage` / `AnalyticsPage` / `InboxPage` / `SettingsPage` / `WizardPage`).
4. Данные — только через `api/*` фичи (сгенерированы `scaffold:api`, дорабатывать можно); моки — `mocks/handlers.ts` (Foundation уже дал базовые для большинства эндпоинтов — см. `pnpm mock:api` и 501-ответы для недостающих).
5. Переводы — `messages/{ru,en}.json`; `pnpm gen --check` должен быть зелёным.
6. e2e — `e2e/*.spec.ts` в фиче (`pnpm e2e`), визуальные эталоны через `toHaveScreenshot`.

## Статус (2026-09-17): готово в объёме волны 1
- `/dashboard/dev/components` — витрина всех `components/lp` (14 секций) + примитивы; в production доступна только с `NEXT_PUBLIC_SHOW_DEV_PAGES=true`.
- `DataTable`: sticky header, плотность `compact`, виртуализация > 200 строк (`@tanstack/react-virtual`).
- `PeriodPicker`: календарь на два месяца (ru-локаль), пресеты, гранулярность, сравнение.
- `TemplateBodyEditor`: автокомплит по `{{`, клавиатура, предпросмотр.
- `RegionChoropleth`: d3-geo + TopoJSON субъектов РФ (Natural Earth, public domain; `pnpm geo:build`), клавиатурно доступные регионы.
- `RankHeatmap`: MapLibre GL при `NEXT_PUBLIC_MAP_STYLE_URL` (воркер отдаётся из `/public/vendor`, копируется `pnpm gen`), иначе сетка. Провайдер тайлов — по SDD-06.
- Тема: `pnpm check:contrast` (WCAG AA для всех пар токенов, в CI), сайдбар открыт по умолчанию.
- Визуальные эталоны: `VISUAL=1 pnpm e2e e2e/visual` (components / locations / overview × light / dark, 1440px), обновление `--update-snapshots`.
- Не сделано: брендовые SVG площадок (используются нейтральные буквенные марки в фирменных цветах — решение по товарным знакам за заказчиком), инбокс на 390px (после UI-F2).

## Definition of Done (SDD-01T §8)
- [ ] Все экраны трека используют шаблоны страниц и работают против mock core-api.
- [ ] Публичный API реализован полностью, props изменены только аддитивно.
- [ ] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [ ] e2e трека и визуальные эталоны (1440px светлая/тёмная, 390px для инбокса).
- [ ] Нет `_local`-компонентов и открытых блокирующих запросов.
- [ ] `feature.ts` → `status: 'ready'`.
