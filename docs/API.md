# API (MVP)

Все endpoint'ы требуют авторизацию (`auth required`).

## Общие ошибки
- `400 Bad Request` — невалидный payload.
- `401 Unauthorized` — отсутствует/невалидный токен.
- `403 Forbidden` — нет прав доступа к flow.
- `404 Not Found` — flow не найден.
- `500 Internal Server Error` — внутренняя ошибка сервера.

## POST /api/flows
Create flow.

Request JSON:
```json
{
  "title": "Checkout flow",
  "source": "extension"
}
```

Response:
- `201 Created`
```json
{
  "id": "flow_123",
  "title": "Checkout flow",
  "createdAt": "2026-03-02T10:00:00.000Z"
}
```

Errors: `400`, `401`, `500`.

## POST /api/flows/:id/steps
Upload step metadata + screenshot ref.

Request JSON:
```json
{
  "index": 1,
  "title": "Open cart",
  "url": "https://example.com/cart",
  "screenshotRef": "screenshots/flow_123/step_1.png",
  "capturedAt": "2026-03-02T10:01:00.000Z"
}
```

Response:
- `201 Created`
```json
{
  "id": "step_1",
  "flowId": "flow_123",
  "index": 1
}
```

Errors: `400`, `401`, `403`, `404`, `500`.

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
