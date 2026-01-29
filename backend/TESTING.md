# Тестирование Backend

## Unit-тесты (Jest)

```bash
npm run test
```

Запускает все `*.spec.ts` в `src/`. Моки репозиториев и сервисов, БД не нужна.

- Покрытие: `npm run test:cov`

## E2E-тесты (Jest + Supertest)

```bash
npm run test:e2e
```

Требуют **запущенный PostgreSQL** и корректный `.env` (хост, порт, пользователь, пароль, база).

- По умолчанию используется `DATABASE_NAME` из `.env` (часто `pfm_db`). Убедитесь, что база существует.
- Для изолированного E2E используйте отдельную БД `pfm_db_test`:

  ```bash
  # Создать БД (пример для local PostgreSQL)
  psql -U postgres -c "CREATE DATABASE pfm_db_test;"

  # Запуск E2E с тестовой БД
  # Windows (cmd):
  set DATABASE_NAME=pfm_db_test && npm run test:e2e
  # Windows (PowerShell):
  $env:DATABASE_NAME="pfm_db_test"; npm run test:e2e
  # Linux / macOS:
  DATABASE_NAME=pfm_db_test npm run test:e2e
  ```

- При `NODE_ENV=test` TypeORM использует `synchronize: true` (схема поднимается автоматически). Миграции для E2E не обязательны, если устраивает синхронизация.

### Сценарии E2E

- `GET /` — 200, "Hello World!"
- `POST /auth/register` — 201, `access_token`, `user`
- `POST /auth/login` — 200, `access_token`, `user`
- `GET /wallets` без токена — 401
- `GET /wallets` с `Authorization: Bearer <token>` — 200, массив
- `POST /wallets` с токеном — 201, создание кошелька
- `GET /transactions` с токеном — 200, `{ data, total, page, limit }`

Приложение для E2E создаётся через `test/test-app.ts` (ValidationPipe как в prod, без Swagger).
