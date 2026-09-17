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
- [x] Все экраны трека используют шаблоны страниц (`ListPage`, `SettingsPage`) и работают против mock core-api.
- [x] Публичный API: `TemplatePicker`, `TagPicker` (без изменений), `AiReplyButton` теперь стримит через AI SDK `useCompletion` ← `/api/ai/reply` ← core `/ai-replies/generate` (UI message stream) [H-UI-10]; props не менялись.
- [x] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [x] e2e (`features/{templates,tags,auto-replies,ai-replies}/e2e/*.spec.ts`), визуальные эталоны `templates`, `auto-replies`, `ai` (1440px светлая/тёмная).
- [x] Нет `_local`-компонентов и открытых блокирующих запросов.
- [x] `feature.ts` → `status: 'ready'` (templates, tags, auto-replies, ai-replies).

## Что сделано (2026-09-17)
| Экран | Где | Примечания |
| --- | --- | --- |
| S-REV-02 «Шаблоны ответов» | `features/templates/components/manage/*` | `SortableTable` (drag без фильтров), поиск, фасеты «группа / тип», bulk «Действия» (группа / тип / удалить), пагинация с размером страницы; Sheet-редактор с `TemplateBodyEditor` и предпросмотром на реальном отзыве (`POST /reply-templates/render`), неизвестные переменные подсвечиваются; «Настроить группы» — сортируемый список с inline-переименованием. |
| S-REV-03 «Теги» | `features/tags/components/tags-manager.tsx` | CRUD, палитра + произвольный цвет, счётчик отзывов, подтверждение удаления. |
| S-REV-04 «Автоответы» | `features/auto-replies/components/*` | Правила по приоритету (drag), переключатель, Sheet-форма: оценки, текст, площадки, скоуп (`LocationPicker`), ключевые слова → шаблоны с ротацией или профиль нейросети; режим черновик / публиковать, задержка, рабочие часы. Моки `/auto-reply-rules*` добавлены. |
| S-REV-05 «Нейросеть» | `features/ai-replies/components/*` | Профиль (тон, факты о бренде, запрещённые фразы, подпись, языки, длина; несколько профилей) + песочница со стримом. Мок отдаёт UI message stream на `Accept: text/event-stream` (`mocks/lib/ai-stream.ts`). |

