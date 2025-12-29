# Personal Finance Manager (PFM)

Веб-приложение для управления личными финансами с функциями учёта доходов и расходов, контроля бюджета, постановки финансовых целей и повышения финансовой грамотности.

## Технологический стек

### Backend

- **NestJS** - фреймворк для построения серверных приложений
- **PostgreSQL** - база данных
- **TypeORM** - ORM для работы с БД
- **JWT** - аутентификация
- **TypeScript** - типизация

### Frontend

- **Next.js** - фреймворк на React
- **React** - библиотека для создания UI
- **TypeScript** - типизация
- **Ant Design** - UI библиотека
- **Recharts** - визуализация данных

## Установка и запуск

### Требования

- Node.js >= 20.9.0
- npm или yarn
- PostgreSQL (или Docker)

### Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Запуск в режиме разработки

```bash
# Backend (порт 3000)
cd backend
npm run start:dev

# Frontend (порт 3001)
cd frontend
npm run dev
```

### Использование Docker

**Production (все сервисы):**
```bash
# Создать .env файл из примера (если нужно)
cp .env.example .env

# Запуск всех сервисов (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Остановка с удалением volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v
```

**Development (только PostgreSQL):**
```bash
# Запуск только PostgreSQL для разработки
docker-compose -f docker-compose.dev.yml up -d

# Backend и Frontend запускаются локально через npm
```

**Доступные сервисы:**
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5432

## Структура проекта

```
personal-finance-manager/
├── backend/          # NestJS приложение
├── frontend/         # Next.js приложение
└── README.md
```

## Основные функции

- ✅ Регистрация и авторизация пользователей
- ✅ Учёт доходов и расходов
- ✅ Категоризация и тэгирование транзакций
- ✅ Планирование бюджета с лимитами
- ✅ Финансовые цели с визуализацией прогресса
- ✅ Мультивалютные кошельки с автоматическим пересчётом курсов
- ✅ Учёт инвестиций
- ✅ Аналитика и отчёты с графиками
- ✅ Импорт/экспорт данных (CSV, Excel)
- ✅ Образовательный модуль
