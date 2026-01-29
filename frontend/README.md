# Frontend - Personal Finance Manager

Frontend часть приложения на Next.js.

## Запуск

```bash
# Установка зависимостей
npm install

# Режим разработки
npm run dev

# Продакшн
npm run build
npm run start
```

## Порты

- Приложение: http://localhost:3001

## Тесты

- **Unit (Vitest):** `npm run test` или `npm run test:run`
- **E2E (Playwright):** `npm run test:e2e`  
  Перед E2E запустите backend (`cd backend && npm run start:dev`). При первом запуске выполните `npx playwright install chromium`.
