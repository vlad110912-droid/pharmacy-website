# 💊 Pharmacy IS — Веб-сайт Аптеки

**Курсова робота** з дисципліни «Інформаційна стійкість комп'ютерних технологій та мереж»  
Варіант 5 — Аптека | Спеціальність 123 — «Комп'ютерна інженерія»

## Стек технологій

| Компонент | Технологія |
|-----------|-----------|
| Backend   | Node.js 20 + Express.js |
| Frontend  | React 18 + Vite + React Router |
| Database  | PostgreSQL 15 |
| Testing   | Jest + Supertest |
| Deploy    | Docker + Docker Compose |

## Структура проекту

```
pharmacy-project/
├── pharmacy-server/   # Backend (Node.js/Express)
├── pharmacy-client/   # Frontend (React SPA)
├── docker-compose.yml
└── .env.example
```

## Швидкий старт

### 1. Локально (без Docker)

**Backend:**
```bash
cd pharmacy-server
cp .env.example .env      # відредагуйте DB_* та JWT_SECRET
npm install
npm run db:migrate        # PostgreSQL має бути вже запущений на DB_HOST/DB_PORT
npm run dev               # http://localhost:3001
```

Для локального запуску з цього шаблона використовуйте `DB_USER=pharmacy_user` і `DB_PASSWORD=pharmacy_pass`.

Якщо ви запускаєте PostgreSQL через Docker Compose, спершу перейдіть у теку `code/` і виконайте `docker compose up -d db`.

**Frontend:**
```bash
cd pharmacy-client
npm install
npm run dev               # http://localhost:5173
```

### 2. Docker Compose (рекомендовано)

```bash
cp .env.example .env      # відредагуйте паролі
docker-compose up --build
```

Відкрити: **http://localhost**

## Акаунти за замовчуванням

| Логін  | Пароль     | Роль    |
|--------|------------|---------|
| admin  | password   | admin   |

> ⚠️ Змініть пароль у production!  
> Хеш у міграції = `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (пароль: `password`)

## Тестування

```bash
cd pharmacy-server

# Модульні тести BLL (без БД)
npm run test:unit

# Всі тести
npm test
```

Щоб запустити інтеграційні тести, підхопіть змінні з [pharmacy-server/.env.test](pharmacy-server/.env.test) перед `npm run test`:

```bash
cd pharmacy-server
set -a
source .env.test
set +a
npm run test:integration
```

## REST API (основні ендпоінти)

| Метод  | URL                          | Доступ        |
|--------|------------------------------|---------------|
| GET    | /api/products                | Public        |
| GET    | /api/products/expiring       | admin/seller  |
| POST   | /api/products                | admin         |
| POST   | /api/products/write-off-expired | admin      |
| POST   | /api/supplies                | admin/seller  |
| POST   | /api/sales                   | admin/seller  |
| GET    | /api/reports/summary         | admin         |
| POST   | /api/auth/login              | Public        |

## Архітектура

```
React SPA  →  REST API (Express)  →  BLL (Services)  →  DAL (Repositories)  →  PostgreSQL
```

Принципи: **SOLID**, **Repository Pattern**, **Dependency Injection**, **Layered Architecture**
