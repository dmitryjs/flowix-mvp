# ENV

Ниже перечислены переменные окружения для MVP. Реальные значения/секреты в репозиторий не добавляются.

- `NEXT_PUBLIC_SUPABASE_URL` — URL проекта Supabase; используется web-приложением и клиентским Supabase SDK.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — публичный anon key для клиентской авторизации в web-приложении.
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ для операций API routes (только на сервере).
- `SUPABASE_STORAGE_BUCKET` — имя bucket для хранения скриншотов шагов.
- `NEXT_PUBLIC_APP_URL` — базовый URL web-приложения (клиентские ссылки/редиректы).
- `EXTENSION_APP_URL` — URL web-приложения, который использует extension (deep link/переходы), если требуется.
- `NEXT_IGNORE_INCORRECT_LOCKFILE` — фикс для npm workspaces + Next lockfile patch (позволяет игнорировать некорректный lockfile-патчинг Next).
