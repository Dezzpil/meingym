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

1. Скопируйте файл дампа в каталог проекта `PROJECT_DIR/dumps`.
2. Зайдите в контейнер с БД и восстановите дамп из директории `/dumps`:
   ```bash
   /usr/bin/docker exec -i -t /meingym-db-1 /bin/bash
   psql --file="/dumps/meingym-2025_10_28_17_34_03.sql" \
        --single-transaction \
        --username=postgres \
        --host=localhost \
        --port=5432 \
        meingym
   ```