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
