# ARCHITECTURE (MVP)

## Components
- Web app (`apps/web`): интерфейс просмотра flow/storyboard.
- API routes (`apps/web`): серверные endpoint'ы MVP.
- Supabase: аутентификация, база данных, объектное хранилище скриншотов.
- Chrome extension (`apps/extension`):
  - popup: пользовательские действия (старт/стоп/статус),
  - background: оркестрация записи/отправки,
  - content: сбор контекста шага на странице.

## Data flow
1. `record` — extension фиксирует шаг и метаданные.
2. `upload` — extension отправляет метаданные шага и ссылку/файл скриншота через API.
3. `view` — web app получает flow и список шагов для просмотра storyboard.

## Non-goals for MVP
- Нет canvas-редактора.
- Нет AI-функций.
- Нет нелинейных ветвлений flow (только последовательность шагов).
