# API (MVP)

`/api/flows*` endpoint'ы требуют `Authorization: Bearer <supabase_access_token>`.
`/api/auth/token` использует cookie-based auth web-сессии.

## Общие ошибки
- `400 Bad Request` — невалидный payload.
- `401 Unauthorized` — отсутствует/невалидный токен.
- `404 Not Found` — flow не найден.
- `500 Internal Server Error` — внутренняя ошибка сервера.

## POST /api/flows
Create flow (server route for extension).

Request JSON:
```json
{
  "projectId": "proj_123",
  "name": "Checkout flow"
}
```

Headers:
- `Authorization: Bearer <supabase_access_token>`.

Response:
- `201 Created`
```json
{
  "id": "flow_123"
}
```

Errors: `400`, `401`, `404`, `500`.

## GET /api/flows/:id
Get flow by id.

Headers:
- `Authorization: Bearer <supabase_access_token>`.

Response:
- `200 OK`
```json
{
  "id": "flow_123",
  "project_id": "proj_123",
  "name": "Checkout flow",
  "created_at": "2026-03-02T10:00:00.000Z"
}
```

Errors: `401`, `404`, `500`.

## POST /api/flows/:id/steps
Upload step (multipart/form-data).

Request (`multipart/form-data`):
- `file` (png/jpg)
- `url` (string)
- `stepIndex` (number)
- `clickX` (optional)
- `clickY` (optional)
- `viewportW` (optional)
- `viewportH` (optional)

Headers:
- `Authorization: Bearer <supabase_access_token>`.

Response:
- `201 Created`
```json
{
  "stepId": "step_1"
}
```

Errors: `400`, `401`, `404`, `500`.

## GET /api/flows/:id/steps
Get steps list.

Headers:
- `Authorization: Bearer <supabase_access_token>`.

Response:
- `200 OK`
```json
[
  {
    "id": "step_1",
    "flow_id": "flow_123",
    "step_index": 0,
    "url": "https://example.com/cart",
    "screenshot_path": "user/<owner_id>/flows/flow_123/uuid.png",
    "click_x": null,
    "click_y": null,
    "viewport_w": 1440,
    "viewport_h": 900
  }
]
```

Порядок: сортировка по `step_index` по возрастанию.

Errors: `401`, `404`, `500`.

## GET /api/auth/token
Возвращает `accessToken` текущей Supabase session.

Headers:
- Cookie-based auth (требуется авторизованная сессия в cookie).

Response:
- `200 OK`
```json
{
  "accessToken": "<token>"
}
```

Errors: `401`, `500`.
