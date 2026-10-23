# Скрипты обслуживания БД

Одноразовые утилиты, которые правят данные напрямую через Prisma (`@/tools/db`), минуя HTTP и серверные экшены. Нужны для массовых пересчётов после миграций или изменения правил в `src/core`.

Запуск — через npm-скрипты (они добавляют `--import tsx`, поэтому `@/*` резолвится):

```bash
npm run update-actions
npm run update-training-exercises
npm run update-approaches-groups
npm run update-personal-records
npm run create-equip-for-users
npm run collect-exercise-time
npm run mobile-auth-test <email>
```

Переменные окружения каждый скрипт поднимает сам через `dotenv`: все читают `.env.local`, исключение — `mobile-auth-test.ts`, он грузит `.env` (симлинк на `.env.local`).

## Пересчёт справочников и статистики

### update-actions.ts

Прогоняет все упражнения через `handleUpdate` из `src/app/actions/actions.ts`, чтобы применилась актуальная логика пересчёта (например базовость с учётом размера мышцы). Читает `Action` вместе с мышцами agony/synergy/stabilizer/antagonist, ошибки по отдельному упражнению не останавливают общий прогон.

### update-training-exercises.ts

Для `TrainingExercise` с пропущенной статистикой (`liftedMax` или `liftedCountMean` равны 0) пересобирает статистику по всем execution'ам и сохраняет её; если у упражнения нет `TrainingExerciseScore`, создаёт оценку через `createScore`.

### update-approaches-groups.ts

То же для групп подходов: заполняет missing `max` / `countTotal` / `countMean` на основе входящих `Approach`.

### update-personal-records.ts

Полный пересчёт `PersonalRecord` для всех пользователей: тренировки идут от самых ранних к последним по `completedAt`, считаются рекорды за всё время и внутри тренировочных периодов. Идемпотентен — существующие записи удаляются и создаются заново, поэтому полезен после правки или удаления прошлых тренировок.

## Данные пользователей

### create-equipments-for-users.ts

Тем пользователям, у которых ещё нет ни одного `Equipment`, создаёт набор по умолчанию «Тренажерный зал» с грифом, блоками, гантелями и гирями и требованиями (скамья, верхняя перекладина, тренажёр). Нужен для аккаунтов, созданных до появления авторской инициализации оборудования в `setupNewUser`.

## Оценка времени тренировки

### collect-exercise-time.ts

Собирает датасет (NDJSON) для ML-скорера `TrainingTimeMLScorer` — экспорт фактического времени подходов по упражнениям, целям и весу пользователя. Скрипт и сам ML-скорер оставлены, но в приложении этот путь не используется: активен `TrainingTimeAvgScorer` с нормативами времени на подход по цели (`STRENGTH` 5 мин, `MASS` 3.5 мин, `LOSS` 2 мин, `src/core/trainingTime/estimate.ts`).

## Проверка мобильного API

### mobile-auth-test.ts

Ручной smoke-тест аутентификации мобильного клиента: берёт `MOBILE_HMAC_SECRET`, подписывает `email:timestamp` и по HTTPS вызывает `POST /api/mobile/v1/auth/exchange`, затем `GET /api/mobile/v1/me` и `GET /api/mobile/v1/exercises` с полученным JWT. Хост по умолчанию `127.0.0.1`; при `NODE_ENV=development` подставляется `meingym.online`. Требования к окружению и формат ответов — в `docs/mobile-trainings-api.md`.
