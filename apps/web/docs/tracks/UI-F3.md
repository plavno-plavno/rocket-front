# UI-F3 — Reply Tooling

Волна 1. Ветка `ui/UI-F3/<slug>`, worktree `pnpm wt:new UI-F3 <slug>` (порты web 3105, mock 4105).

## Что делает трек
S-REV-02 шаблоны (`SortableTable`, Sheet-редактор с `TemplateBodyEditor`, группы), S-REV-03 теги, S-REV-04 автоответы, S-REV-05 нейросеть (профиль + песочница со стримом [H-UI-10])

## Публичный API трека (SDD-01T §3.5)
`TemplatePicker`, `TagPicker`, `AiReplyButton` (стрим через AI SDK)

## Потребляет
DS, F1 (`LocationPicker`)

## Фичи и пути
- `features/templates` — экраны S-REV-02; API-теги templates
- `features/tags` — экраны S-REV-03; API-теги tags
- `features/auto-replies` — экраны S-REV-04; API-теги auto-replies
- `features/ai-replies` — экраны S-REV-05; API-теги ai-replies

Точные globs владения — `apps/web/tracks.json` (`UI-F3`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F3 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F3/apps/web && pnpm wt:dev`.
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
