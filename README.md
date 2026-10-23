# MeinGym

MeinGym — это веб‑приложение для планирования, выполнения и отслеживания прогресса в тренировках с учетом периодизации и прогрессии нагрузок.

## Возможности

- Управление тренировочными периодами и циклами
- История упражнений и тренировка по шаблонам
- Графики и визуализация прогресса
- Планирование и расписание тренировок
- Оценка производительности и аналитика по нагрузкам
- Личные рекорды и учёт веса тела
- Фоновые задачи для пересчета данных и обновления аналитики
- Мобильный API v1: синхронизация тренировок, оценок, рекордов и весов

## Технологии

- **Frontend**: Next.js 14, React, Bootstrap
- **Backend**: Next.js API Routes и Server Actions
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (email + пароль); OAuth-провайдеры GitHub/Google временно отключены. Для мобильного API — отдельная схема HMAC → JWT
- **Background jobs**: Bull + Redis
- **Testing**: node:test + Chai

## Быстрый старт

### Предварительные требования

- Node.js (LTS, совместимый с Next.js 14)
- PostgreSQL
- Redis (для фоновых задач)

### Установка и запуск

1. Клонируйте репозиторий.
2. OAuth-приложения создавать не нужно: веб-вход работает по email/паролю, провайдеры GitHub и Google отключены флагом `ENABLE_OAUTH = false` в `src/tools/auth.ts`.
3. Скопируйте `.env.dist` в `.env.local`.
4. Заполните переменные окружения в `.env.local`: `DATABASE_PRISMA_URL`, `DATABASE_URL_NON_POOLING`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `REDIS_HOST`, `REDIS_PORT`, а для мобильного API — `MOBILE_HMAC_SECRET`, `MOBILE_JWT_SECRET` и `MOBILE_APP_TOKEN`.
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
   По умолчанию сервер поднимается на порту 3005.
8. (Опционально) Запустите воркеры фоновых задач:
   ```bash
   npm run workers
   ```


## Разработка

Более детальные правила и договоренности описаны в [Project Guidelines](./.junie/guidelines.md).

### Часто используемые команды

```bash
# Разработка
npm run dev             # dev‑сервер на порту 3005
npm run workers         # воркеры фоновых задач

# Тесты (скрипта npm test нет)
npm run test:core       # бизнес-логика src/core
npm run test:mobile     # мобильный API src/mobile
npm run test:mobile-auth # HMAC/JWT-аутентификация мобильного клиента
npm run test:tools      # общие хелперы src/tools

# Типы и линтер
npx tsc --noEmit
npm run lint

# База данных
npm run prisma:migrate  # миграции

# Релизы
npm run release:patch    # патч‑релиз
npm run release:feature  # минорный релиз
npm run release:breaking # мажорный релиз
```

### Мобильный API

Эндпоинты под `/api/mobile/v1/*` (`auth/exchange`, `auth/register`, `me`, `exercises`, `trainings`, `trainings/scores`, `weights`, `records`) используют собственную аутентификацию — обмен email + HMAC-подписи на JWT. Полное описание запросов и ответов: [docs/mobile-trainings-api.md](./docs/mobile-trainings-api.md).

### Деплой

На сервере запускается `./deploy.sh`: останавливает приложение в pm2, ставит зависимости (`npm ci`), накатывает миграции (`prisma generate`, `prisma migrate deploy`), собирает проект (`npm run build`), выполняет пересчёт данных (`npm run update-actions`, `npm run update-personal-records`) и поднимает процесс обратно (`pm2 start meingym`). Переменные окружения берутся из `.env.local` (в репозитории `.env` — симлинк на него).

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