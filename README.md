# MeinGym

MeinGym — это веб‑приложение для планирования, выполнения и отслеживания прогресса в тренировках с учетом периодизации и прогрессии нагрузок.

## Возможности

- Управление тренировочными периодами и циклами
- История упражнений и тренировка по шаблонам
- Графики и визуализация прогресса
- Планирование и расписание тренировок
- Оценка производительности и аналитика по нагрузкам
- Фоновые задачи для пересчета данных и обновления аналитики

## Технологии

- **Frontend**: Next.js 14, React, Bootstrap
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (GitHub/Google OAuth)
- **Background jobs**: Bull + Redis
- **Testing**: node:test + Chai

## Быстрый старт

### Предварительные требования

- Node.js (совместимый с Next.js 14.0.4)
- PostgreSQL
- Redis (для фоновых задач)

### Установка и запуск

1. Клонируйте репозиторий.
2. Создайте OAuth‑приложения в GitHub или Google для NextAuth.js.
3. Скопируйте `.env.dist` в `.env.local`.
4. Заполните переменные окружения в `.env.local`.
5. Установите зависимости:
   ```bash
   npm ci
   ``` 

6. Примените миграции БД:
   ```bash
   npm run prisma:migrate
   ```

7. Запустите dev‑сервер:
   ```bash
   npm run dev
   ```
   По умолчанию сервер поднимается на порту 3004.
8. (Опционально) Запустите воркеры фоновых задач:
   ```bash
   npm run workers
   ```


## Разработка

Более детальные правила и договоренности описаны в [Project Guidelines](./.junie/guidelines.md).

### Часто используемые команды

```bash
# Разработка
npm run dev             # dev‑сервер на порту 3004
npm test                # все тесты
npm run workers         # воркеры фоновых задач

# База данных
npm run prisma:migrate  # миграции

# Релизы
npm run release:patch    # патч‑релиз
npm run release:feature  # минорный релиз
npm run release:breaking # мажорный релиз
```

### Импорт дампов БД

0. Сделать дамп `/usr/lib/postgresql/16/bin/pg_dump -h localhost -U meingym -d meingym -f meingym-DATE-pg-dump.sql`
1. Скопировать дамп в `PROJECT_DIR/dumps`.
2. Добавить строчки:
   ```shell
   CREATE SCHEMA IF NOT EXISTS public;
   ALTER SCHEMA public OWNER TO pg_database_owner;
   ```
3. Накатить дамп:
   ```bash
   /usr/bin/docker exec -i -t /meingym-db-1 /bin/bash
   export PAGER=cat
   psql --file="/dumps/meingym-2026-08-17-pg-dump.sql" \
        --single-transaction \
        --username=postgres \
        --host=localhost \
        --port=5432 \
        meingym
   ```