# API (MVP)

Все endpoint'ы требуют авторизацию (`auth required`).

## Общие ошибки
- `400 Bad Request` — невалидный payload.
- `401 Unauthorized` — отсутствует/невалидный токен.
- `403 Forbidden` — нет прав доступа к flow.
- `404 Not Found` — flow не найден.
- `500 Internal Server Error` — внутренняя ошибка сервера.

## POST /api/flows
Create flow (server route for extension).

Request JSON:
```json
{
  "projectId": "proj_123",
  "name": "Checkout flow",
  "ownerId": "user_123"
}
```

Headers:
- `x-owner-id: user_123` (должен совпадать с `ownerId`).

Response:
- `201 Created`
```json
{
  "id": "flow_123"
}
```

Errors: `400`, `401`, `403`, `500`.

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
- `ownerId` (string)

Headers:
- `x-owner-id` (должен совпадать с `ownerId`).

Response:
- `201 Created`
```json
{
  "stepId": "step_1"
}
```

Errors: `400`, `401`, `403`, `500`.

## GET /api/flows/:id
Get flow.

Response:
- `200 OK`
```json
{
  "id": "flow_123",
  "title": "Checkout flow",
  "createdAt": "2026-03-02T10:00:00.000Z"
}
```

Errors: `401`, `403`, `404`, `500`.

## GET /api/flows/:id/steps
Get steps list.

Response:
- `200 OK`
```json
{
  "items": [
    {
      "id": "step_1",
      "flowId": "flow_123",
      "index": 1,
      "title": "Open cart",
      "url": "https://example.com/cart",
      "screenshotRef": "screenshots/flow_123/step_1.png",
      "capturedAt": "2026-03-02T10:01:00.000Z"
    }
  ]
}
```

Errors: `401`, `403`, `404`, `500`.
