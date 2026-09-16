# UX writing (SDD-01T §6.1)

Applies to every string in `messages/*.json`. RU is the source language; EN mirrors it.

## Tone
- Neutral, concise, second person plural («Добавьте компанию»). No exclamation marks in UI chrome, no jokes.
- Buttons are verbs in the infinitive («Сохранить», «Добавить компанию»); destructive ones name the object («Удалить компанию»).
- Errors say what happened and what to do next («Ссылка устарела — запросите новую»). Never expose stack traces; the request id goes in monospace below the message.

## Terminology (glossary of the SDD README)
| UI (RU) | UI (EN) | Code |
|---|---|---|
| Компания | Location | `Location` |
| Группа / бренд / регион | Group / brand / region | `LocationGroup` |
| Площадка / источник | Platform / source | `Platform` |
| Карточка | Listing | `Listing` |
| Аккаунт площадки | Platform account | `PlatformAccount` |
| Синхронизированы / Отправлены / Требуется действие | Synced / Sent / Action required | `SyncStatus` |
| Код филиала | Branch code | `branch_code` |
| Отзыв без ответа | Unanswered review | `has_published_reply = false` |

Use «Все компании» for the global scope, «Карточка» for a platform listing, never «локация» in UI text.

## Formats
- Dates through `useFormatter().dateTime(d, 'short' | 'medium' | 'long' | 'time')` in the tenant timezone; relative time only for < 7 days.
- Numbers through `useFormatter().number()`; percentages as `percent` format, one decimal max; ratings with one decimal («4,6»).
- Durations: «21 мин 58 с», «2 ч 05 мин»; over 24 h — «1 д 3 ч».
- Counters in badges: `9+` above nine in the header, exact numbers elsewhere.

## States
- Empty: title + one sentence + primary action when the user can create the object; when a filter is active say so («По вашим фильтрам ничего не найдено»).
- Loading: skeleton of the final layout, never a spinner alone (except inside buttons).
- Error: `RouteError` pattern — heading, message, request id, «Попробовать снова».
- No access: «У вас нет доступа к этой странице.» via `PageContainer access={false}`.
- Planned: `PlannedPage`.

## Status is never colour only
Every status renders icon + text (`SyncStatusBadge`); charts have legends; rating stars carry an accessible label.
