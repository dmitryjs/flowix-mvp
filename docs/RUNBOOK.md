# RUNBOOK (MVP)

## 1) Extension не пишет шаги
1. Проверить, что extension установлен и включен в Chrome.
2. Проверить, что у extension есть нужные permissions (включая activeTab/tabs).
3. Проверить логи popup/background в DevTools extension.
4. Проверить, что пользователь авторизован и есть валидный flow id.

## 2) 401/403 от API
1. Проверить наличие `Authorization` заголовка в запросах.
2. Проверить валидность токена и срок его жизни.
3. Проверить, что flow принадлежит текущему пользователю.
4. Проверить RLS/политики доступа в Supabase.

## 3) Скриншоты не грузятся (storage)
1. Проверить, что задан `SUPABASE_STORAGE_BUCKET`.
2. Проверить права на upload/read для bucket в Supabase.
3. Проверить формат `screenshotRef` и путь объекта.
4. Проверить ответ storage API (код, сообщение об ошибке).

## 4) CORS/Origin проблемы
1. Проверить Origin в запросе и список разрешенных origin на backend.
2. Проверить preflight (`OPTIONS`) и заголовки `Access-Control-*`.
3. Проверить, что `NEXT_PUBLIC_APP_URL`/`EXTENSION_APP_URL` соответствуют окружению.
4. Проверить различия между localhost и production доменами.

## 5) Несоответствие env
1. Сверить `.env` с `docs/ENV.md` (имена и назначение).
2. Проверить, что клиентские переменные начинаются с `NEXT_PUBLIC_`.
3. Проверить, что серверные секреты не доступны на клиенте.
4. Перезапустить dev-сервер после изменения env.

## 6) Extension API returns HTML / redirect
1. Симптом: extension получает HTML страницы login вместо JSON от `/api/*`.
2. Причина: middleware применился к API и сделал redirect на `/login`.
3. Проверка: `curl -i http://localhost:3000/api/flows/<flow_id>` должен вернуть JSON (`401/404`), но не `text/html`.
4. Проверка: в `Network` у `/api/*` не должно быть 30x редиректа на `/login`.

## 7) "supabaseUrl is required" / env ошибка Supabase
1. Проверить наличие `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в `apps/web/.env.local`.
2. Проверить `SUPABASE_STORAGE_BUCKET` и `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` в `apps/web/.env.local`.
3. После изменения env полностью перезапустить `npm run dev:web`.
4. Если ошибка сохраняется, выполнить `npm run build --workspace=web` и проверить текст ошибки на пропущенные env.
