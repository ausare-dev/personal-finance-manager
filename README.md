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
# Установить переменную окружения для пароля БД
export POSTGRES_PASSWORD=your-secure-password

# Запуск только PostgreSQL для разработки
docker-compose -f docker-compose.dev.yml up -d

# Backend и Frontend запускаются локально через npm
```

**Важно:** Для `docker-compose.dev.yml` необходимо задать переменную окружения `POSTGRES_PASSWORD` (без дефолтного значения в целях безопасности).

**Доступные сервисы:**

- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL (dev): localhost:5434

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
- ✅ Демо-режим для тестирования

## Демо-режим

Приложение включает демо-режим с предзаполненными данными для быстрого ознакомления.

**Демо-аккаунт:**
- Email: `demo@example.com`
- Password: `demo123`

Для создания демо-данных выполните:
```bash
cd backend
npm run seed:run
```

## Документация

- **[API Документация](API.md)** - Полное описание REST API
- **[Инструкция по развертыванию](DEPLOYMENT.md)** - Руководство по развертыванию в production
- **Swagger UI** - Интерактивная документация API доступна на http://localhost:3000/api (при запущенном backend)

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd personal-finance-manager
```

### 2. Запуск с Docker (самый простой способ)

```bash
# Настройте .env файл (см. DEPLOYMENT.md)
docker-compose up -d

# Выполните миграции
docker-compose exec backend npm run migration:run

# (Опционально) Заполните демо-данными
docker-compose exec backend npm run seed:run
```

Приложение будет доступно:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger UI: http://localhost:3000/api

### 3. Локальная разработка

#### Backend

```bash
cd backend
npm install

# Настройте .env файл (см. backend/.env.example)
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install

# Настройте .env.local (см. DEPLOYMENT.md)
npm run dev
```

## Структура проекта

```
personal-finance-manager/
├── backend/          # NestJS приложение
│   ├── src/         # Исходный код
│   ├── test/        # Тесты
│   └── package.json
├── frontend/         # Next.js приложение
│   ├── app/         # Страницы (App Router)
│   ├── components/  # React компоненты
│   ├── services/    # API сервисы
│   └── package.json
├── docker-compose.yml        # Docker Compose для production
├── docker-compose.dev.yml    # Docker Compose для разработки
├── API.md           # API документация
├── DEPLOYMENT.md    # Инструкция по развертыванию
└── README.md        # Этот файл
```

## Технические детали

### Backend
- **Framework**: NestJS
- **База данных**: PostgreSQL с TypeORM
- **Аутентификация**: JWT (JSON Web Token)
- **Валидация**: class-validator
- **Документация**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler
- **Тестирование**: Jest

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI библиотека**: Ant Design
- **Графики**: Recharts
- **Формы**: react-hook-form + yup
- **HTTP клиент**: Axios
- **Язык**: TypeScript

## Скрипты

### Backend

```bash
npm run start:dev    # Разработка с hot reload
npm run build        # Сборка для production
npm run start:prod   # Запуск production сборки
npm run test         # Запуск unit тестов
npm run migration:run    # Выполнить миграции
npm run migration:revert # Откатить миграции
npm run seed:run     # Заполнить БД тестовыми данными
```

### Frontend

```bash
npm run dev          # Разработка с hot reload
npm run build        # Сборка для production
npm run start        # Запуск production сборки
npm run lint         # Проверка кода
```

## Лицензия

[Укажите лицензию проекта]
