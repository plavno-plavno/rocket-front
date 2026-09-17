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
- [x] Все экраны трека используют шаблоны страниц (`InboxPage`) и работают против mock core-api.
- [x] Публичный API реализован полностью (`ReviewDrawer` = полный `ReviewDetail` в Sheet, `RecentReviewsList`), props не менялись.
- [x] Переводы RU/EN, `gen --check` без ошибок и без provisional.
- [x] e2e трека (`features/reviews/e2e/{inbox,inbox.mobile}.spec.ts`, `features/questions/e2e/questions.spec.ts`), визуальные эталоны 1440px светлая/тёмная (`reviews`, `questions`) и 390px (`e2e/visual/inbox.mobile.spec.ts`).
- [x] Нет `_local`-компонентов и открытых блокирующих запросов.
- [x] `feature.ts` → `status: 'ready'` (reviews, questions).

## Что сделано (2026-09-17)
| Экран | Где | Примечания |
| --- | --- | --- |
| S-REV-01 «Обработка отзывов» | `features/reviews/components/inbox/*`, `components/review-detail.tsx` | KPI (5 карточек, клик = фильтр по оценке), список с курсорной подгрузкой (`useInfiniteQuery`), детали (шапка, diff версий, ответственный / статус / теги, вкладки Ответы / Заметки / История), композер (шаблон, ИИ-стрим, предпросмотр переменных, ⌘↵, черновик), редактирование и удаление ответа, жалоба (причины площадки), ручной отзыв [H-UI-06], экспорт с поллингом, сортировка, панель фильтров (закреплена ≥ 1536px, Sheet ниже), горячие клавиши `j/k/r/t/a`, плашка «N новых» через `useRealtime()`. |
| S-QA-01 «Вопросы и ответы» | `features/questions/components/questions-inbox.tsx` | Упрощённый инбокс: список, детали с ответственным / статусом, ответы с поллингом публикации, фильтры (есть ответ, статус, источник). Моки `/questions*` добавлены. |
| `InboxPage` (шаблон DS) | `components/lp/templates/inbox-page.tsx` | Мобильный режим (< 768px): KPI — горизонтальная лента, список ↔ детали по `?<detailParam>=` с кнопкой «Назад». |

