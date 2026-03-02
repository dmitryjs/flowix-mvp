# DECISIONS

## D1. Scope MVP
MVP = storyboard viewer, без canvas.

## D2. Repository shape
Monorepo:
- `apps/web` (Next.js)
- `apps/extension` (Chrome MV3)
- `packages/shared`

## D3. Backend
Backend для MVP реализуется через Next.js API routes.

## D4. Platform services
Auth/DB/Storage = Supabase.

## D5. Screenshot capture
Скриншоты в MVP: только viewport (`captureVisibleTab`).

## D6. Flow model
Flow линейный: шаг `N -> N+1`.

## D7. MVP auth
Аутентификация в MVP: Supabase magic link (email OTP), базовая защита страниц через middleware с редиректом на `/login`.

## D8. Web MVP data access
Для MVP страницы проектов/flow используют прямой CRUD из web-клиента через Supabase client (без API routes).

## D9. Extension server routes
Для интеграции extension добавлены server API routes в `apps/web` для создания flow и загрузки step-файла через Supabase Storage (service role на сервере).

## D10. Extension API auth
Авторизация extension API выполняется через `Authorization: Bearer <supabase_access_token>`, `owner_id` определяется на сервере по токену.
