# Flowix MVP

## Что такое Flowix MVP
Flowix MVP — минимальная версия продукта для записи и просмотра линейных пользовательских flow в формате storyboard.

## Что умеет (MVP)
- Создание flow.
- Добавление шагов с метаданными и ссылкой на скриншот viewport.
- Просмотр flow и списка шагов в web-интерфейсе.
- Работа через web-приложение и Chrome extension.

## Структура репо
- `apps/web` — Next.js приложение и API routes.
- `apps/extension` — Chrome Extension (MV3).
- `packages/shared` — общие типы/утилиты.
- `docs` — проектная документация и решения.

## Локальный запуск
Подробный гайд по локальному запуску будет добавлен на шаге X.

### Supabase Storage (MVP)
- Bucket name: `flowix-screens`
- Public: `false`
- `apps/web/.env.local` должен содержать:
  - `SUPABASE_STORAGE_BUCKET=flowix-screens`

## Команды
- `lint` — TBD
- `typecheck` — TBD
- `test` — TBD

## Chrome Extension (MVP)
- Сборка extension:
  - `cd apps/extension`
  - `npm install`
  - `npm run build`
- Загрузка unpacked в Chrome:
  - открыть `chrome://extensions`
  - включить `Developer mode`
  - нажать `Load unpacked` и выбрать `apps/extension/dist`
- Проверка popup и storage:
  - кликнуть иконку extension, открыть popup
  - нажать `Start` / `Stop` / `Capture`
  - на странице `chrome://extensions` открыть `service worker`/popup devtools и проверить значения в `chrome.storage.local` (`recording`, `lastCaptureAt`)

### End-to-end test (local)
- Убедиться, что web-приложение запущено на `http://localhost:3000` и пользователь авторизован.
- В web создать `project` и скопировать его `id`.
- В браузере на странице web app открыть DevTools Console и получить `access_token` из localStorage:
  - открыть `Application -> Local Storage -> http://localhost:3000`
  - найти ключ формата `sb-...-auth-token`
  - скопировать поле `access_token` из JSON значения.
- В popup extension вставить `Project ID` и `Access Token`, затем нажать `Start` и `Capture`.
- Проверить в `chrome.storage.local` значения: `recording`, `accessToken`, `currentFlowId`, `stepIndex`.
- Открыть flow в web viewer и убедиться, что шаг добавился и скриншот отображается.

## Лицензия
none
