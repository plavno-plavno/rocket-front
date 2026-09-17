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
- [x] Все экраны трека используют шаблоны страниц и работают против mock core-api.
- [x] Публичный API реализован полностью, props изменены только аддитивно.
- [x] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [x] e2e трека (`features/locations/e2e/{list,detail,bulk,import}.spec.ts`, `features/sources/e2e/sources.spec.ts`); визуальные эталоны — `e2e/visual` (1440px светлая/тёмная).
- [x] Нет `_local`-компонентов и открытых блокирующих запросов (неблокирующие: `docs/requests/20260917-UI-F1-cross-track-fixes.md`, контракт — `packages/contracts/CHANGE_REQUESTS.md`).
- [x] `feature.ts` → `status: 'ready'` (locations, sources).

## Что сделано (2026-09-17)
| Экран | Где | Примечания |
| --- | --- | --- |
| S-LOC-01 «Мои компании» | `components/location-table/*` | KPI, фасеты, bulk-бар: массовое редактирование (Sheet → SyncBatch с прогрессом), назначить группу, временно закрыть / снова открыть, экспорт выбранных (поллинг `GET /exports/{id}` → тост со ссылкой). |
| S-LOC-02 «Импорт компаний» | `components/location-import/import-wizard.tsx` | WizardPage: файл → колонки (автосопоставление по заголовкам RU/EN) → проверка (создать/обновить/ошибка) → применение (прогресс батча) → отчёт (повторить неуспешные). Шаблон — `public/templates/locations-import-template.csv`. |
| S-LOC-03 «Карточка компании» | `components/location-form/*`, `components/location-detail/*` | Вкладки Данные / Карточки / История / Отзывы; сохранение через предпросмотр синхронизации (dry-run), 409 при конфликте версий, откат версии. Таксономия категорий — статический список до появления эндпоинта (CHANGE_REQUESTS). |
| S-SRC-01 «Источники» | `features/sources/components/sources-overview.tsx` | Карточки площадок (синхронизировано / покрытие / health), таблица аккаунтов (проверить, переподключить OAuth), таблица покрытия по статусам; `?kind=` вкладки. |
| `LocationPicker` | `components/location-picker.tsx` | Дерево групп (бренд → регион → город) + поиск по компаниям (серверный `q`), «Выбрать найденные», single/multi. Демо — `/dashboard/dev/components#location-picker`. |

