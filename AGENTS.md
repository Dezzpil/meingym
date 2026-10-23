# AGENTS.md

Инструкция для агентов, работающих с репозиторием MeinGym.

## О проекте

MeinGym — веб-приложение для планирования, выполнения и отслеживания тренировок (периодизация, прогрессия нагрузок) с мобильным клиентом на том же бизнес-ядре. Стек: Next.js 14 (App Router) + React 18 + Bootstrap (react-bootstrap), PostgreSQL + Prisma, Redis + Bull (фоновые задачи), NextAuth. Язык проекта — русский: README, документация и сообщения коммитов пишутся по-русски.

## Структура

- `src/app/` — страницы App Router (trainings, approaches, equipment, weights, admin и др.) и серверные экшены; `src/app/api/` — HTTP-роуты
- `src/app/api/mobile/v1/` — мобильный API (собственная JWT-аутентификация)
- `src/core/` — бизнес-логика (progression, difficulty, scores, trainingProcessing, periods, records)
- `src/jobs/` — очереди Bull (`scores`, `periods`, `images`, `trainings`) и их процессоры; имена очередей и задач — в `src/jobs/config.ts`
- `src/mobile/` — логика мобильного API (exchange, register, trainings, syncTrainings, scores, records, weights, exercises; хелперы — в `src/mobile/tools/`)
- `src/components/` — общие React-компоненты
- `src/tools/` — общие хелперы (db, auth, dates, cachedQueries и др.)
- `src/scripts/` — разовые скрипты обновления данных в БД
- `src/tests/` — тесты (core, mobile, mobile-auth, tools)
- `prisma/` — схема и миграции; `docs/` — документация мобильного API
- `.qoder/repowiki/en/` — сгенерированная база знаний по архитектуре (англ.)

## Команды

```bash
npm run dev               # dev-сервер на порту 3005 (NEXTAUTH_URL в .env.local должен совпадать)
npm run build             # production-сборка
npm run lint              # ESLint (next lint)
npx tsc --noEmit          # проверка типов

npm run test:core         # тесты core-логики
npm run test:mobile       # тесты мобильного API (запускается с --experimental-test-module-mocks)
npm run test:mobile-auth  # тесты мобильной аутентификации
npm run test:tools        # тесты общих хелперов (src/tools)

npm run prisma:migrate    # миграции (dotenv подставляет .env.local)
npm run workers           # воркеры фоновых задач (нужен запущенный Redis)
```

Скрипта `npm test` нет — только перечисленные `test:*`.

## Правила и соглашения

Подробные правила — `.junie/guidelines.md`, читать перед существенными правками. Ключевое:

- Не сортировать выборки из БД в коде приложения — сортировка и фильтрация на стороне БД.
- Бизнес-логика в сервисах (`src/core/`, `src/mobile/`), а не в «толстых» роутах и серверных экшенах.
- Валидация на границах (HTTP-хендлеры, экшены, воркеры) через zod, fail fast.
- UI: flex-утилиты вместо row/col-сетки, без inline-стилей, спокойная палитра, консистентные паттерны между страницами; не менять типографику без веской причины.
- Тесты на поведение, а не реализацию; при фиксе бага добавлять тест, который его ловит.
- Тяжёлые вычисления и агрегации — в фоновые задачи (Bull), HTTP-запросы держать быстрыми.
- Импорты через алиас `@/*` → `src/*`.
- Коммиты: conventional commits на русском (`feat: добавить ...`), commitlint + husky, заголовок до 200 символов.

## Аутентификация (важно)

- Веб: NextAuth с CredentialsProvider (email/pass, bcryptjs). OAuth-провайдеры выключены флагом `ENABLE_OAUTH = false` в `src/tools/auth.ts` — переход на email/pass временный, закомментированные OAuth-провайдеры не удалять.
- Мобильный API: отдельная схема — обмен `email` + HMAC-SHA256-подписи timestamp на JWT через `POST /api/mobile/v1/auth/exchange`; секреты `MOBILE_HMAC_SECRET` / `MOBILE_JWT_SECRET`, для `POST /auth/register` нужен `MOBILE_APP_TOKEN`. Эндпоинты: `auth/exchange`, `auth/register`, `me`, `exercises`, `trainings` (GET/POST), `trainings/scores`, `weights` (GET/POST), `records`. Синхронизация тренировок ставит job в очередь `trainings`. Документация: `docs/mobile-trainings-api.md`.

## Окружение и эксплуатация

- `.env` — симлинк на `.env.local`; шаблон переменных — `.env.dist`. Для работы нужны PostgreSQL и Redis (docker-compose.yml поднимает БД).
- Кэширование запросов уровня запроса — React `cache()` в `src/tools/cachedQueries.ts`; переиспользовать, а не создавать дубликаты.
- Релизы через standard-version: `npm run release:patch | feature | breaking`.
- Деплой: `deploy.sh` — `pm2 stop meingym`, `npm ci`, `prisma generate`, `prisma migrate deploy`, `npm run build`, затем пересчёт данных (`npm run update-actions` и `npm run update-personal-records`) и `pm2 start meingym`. Дампы БД кладутся в `dumps/` и восстанавливаются внутри docker-контейнера БД через `psql --file=/dumps/...`.
- После правки `prisma/schema.prisma`: создать миграцию (`npm run prisma:migrate`); Prisma-клиент генерируется стандартными хуками.

## Документация перед правками чувствительных зон

- Мобильный API: `docs/mobile-trainings-api.md` и `.qoder/repowiki/en/content/Architecture Overview/Mobile API System.md`
- Фоновые задачи: `src/jobs/README.md` (очереди, процессоры, мониторинг), имена — в `src/jobs/config.ts`
- Архитектура и модель данных в целом: `.qoder/repowiki/en/content/`
