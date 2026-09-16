# UI-F7 — Admin & Settings

Волна 1. Ветка `ui/UI-F7/<slug>`, worktree `pnpm wt:new UI-F7 <slug>` (порты web 3106, mock 4106).

## Что делает трек
S-SET-01 пользователи (Sheet «Добавить пользователей», роли, `LocationPicker` для правил доступа), S-SET-02…06 профиль / аккаунты площадок (OAuth через `/__mock/oauth/:id`) / уведомления / интеграции (API-ключи показываются один раз, вебхуки) / источники, S-NOT-01 центр уведомлений (доделать), S-ONB-01 онбординг (WizardPage), доводка auth-страниц

## Публичный API трека (SDD-01T §3.5)
`UserCombobox` (searchable), `NotificationBell`

## Потребляет
DS, F1 (`LocationPicker`)

## Фичи и пути
- `features/settings` — экраны S-SET-02, S-SET-03, S-SET-04, S-SET-05, S-SET-06; API-теги tenants, integrations
- `features/users` — экраны S-SET-01; API-теги users
- `features/notifications` — экраны S-NOT-01; API-теги notifications
- `features/onboarding` — экраны S-ONB-01; API-теги —

Точные globs владения — `apps/web/tracks.json` (`UI-F7`). Всё вне них — только через `docs/requests/` или PR с меткой `cross-track`.

## Как начать
1. `pnpm wt:new UI-F7 <slug>` из `apps/web` основного checkout → `cd ../lp-ui-UI-F7/apps/web && pnpm wt:dev`.
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
