# Фоновые задачи (Bull + Redis)

Асинхронные вычисления MeinGym: пересчёт оценок упражнений, обработка завершённых тренировок, закрытие неактивных периодов и чистка неиспользуемых изображений. Брокер — Redis, потребитель — отдельный процесс воркера.

## Запуск

```bash
npm run workers        # node --import tsx src/jobs/index.ts, нужен запущенный Redis
```

Redis берётся из `REDIS_HOST` / `REDIS_PORT` (по умолчанию `localhost:6379`, в docker-compose.yml порт 6379).

## Структура

```
src/jobs/
├── index.ts              # импорт процессоров (side effect), хелперы schedule*, регистрация cron-задач
├── queues.ts             # создание очередей Bull и привязка процессоров к job names
├── config.ts             # redisConfig, queueNames, jobNames, defaultJobOptions
└── processors/
    ├── scores.ts
    ├── trainings.ts
    ├── periods.ts
    └── images.ts
```

Направления зависимостей строгие: процессоры знают только про `@/tools/db` и `@/core/*`, но не про `src/app`. Вся бизнес-логика живёт в `src/core`, процессор лишь распаковывает payload и вызывает её.

## Очереди и задачи

| Очередь | Job name | Процессор | Payload | Что делает |
|---|---|---|---|---|
| `scores` | `calculate-scores` | `calculationScoreProcessor` | `{ trainingId }` | Для всех `TrainingExercise` тренировки пересчитывает оценки через `createScore` (`src/core/scores.ts`) |
| `trainings` | `process-completed-training` | `trainingProcessingProcessor` | `{ trainingId, userId }` | Вызывает `processCompletedTrainingCore` (`src/core/trainingProcessing.ts`): рекорды, мышцы, статистика, затем ставит job в очередь `scores` |
| `periods` | `check-inactive-periods` | `checkInactivePeriodsProcessor` | `{}` | Текущие `TrainingPeriod` без завершённых тренировок за последние 7 дней закрывает через `endCurrentTrainingPeriod` |
| `images` | `cleanup-orphaned-images` | `cleanupImagesProcessor` | `{}` | Удаляет из `public/uploads` файлы, на которые нет ссылки в `ExerciseImage` |

### Как задачи попадают в очередь

| Задача | Источник |
|---|---|
| `trainings` | `POST /api/mobile/v1/trainings` — после записи синхронизации (`src/mobile/syncTrainings.ts:217`) |
| `scores` | из `processCompletedTrainingCore` (`src/core/trainingProcessing.ts:184`), то есть цепочкой после `trainings` |
| `periods` | cron `0 0 * * *` — ежедневно в полночь |
| `images` | cron `0 3 * * *` — ежедневно в 03:00 |

Оба cron-задания регистрируются сами при импорте `@/jobs` (`src/jobs/index.ts:59-62`). Это побочный эффект: модуль импортируют не только воркеры, но и `src/core`, и API-роуты, поэтому повторная регистрация repeat-job происходит при старте каждого процесса.

Хелперы для вызова из кода приложения: `scheduleScoreCalculation(trainingId)`, `scheduleTrainingProcessing(trainingId, userId)`, `scheduleCheckInactivePeriods()`, `scheduleCleanupOrphanedImages()` — все возвращают `{ jobId }`.

## Опции задач

Единые для всех очередей — `defaultJobOptions` в `src/jobs/config.ts:34`:

- `attempts: 3` с экспоненциальным backoff (задержка от 5 с);
- `removeOnComplete: true` — выполненная задача удаляется из Redis, поэтому истории задач нет: разбирать инциденты нужно по логам воркера.

Каждый процессор в `finally` вызывает `prisma.$disconnect()`, так как воркеры — долгоживущие, но независимые от веб-процесса Node-процессы.

## Мониторинг

- `GET /api/jobs` (`src/app/api/jobs/route.ts`) — счётчики и активные задачи. Метод один, POST-задач этот роут не ставит.
- Дашборд `/admin/jobs` — интерфейс над этим же GET-роутом.

Роут опрашивает только очереди `scores` и `periods`. Состояние `trainings` и `images` в мониторинге не видно — при разборе проблем с обработкой тренировки или чисткой изображений читайте вывод `npm run workers`.

## Как добавить новый тип задачи

1. В `src/jobs/config.ts` добавить имя очереди в `queueNames` и имя задачи в `jobNames`.
2. В `src/jobs/processors/` создать процессор: payload из `job.data`, бизнес-логика — вызов функции из `@/core`, `$disconnect()` в `finally`, ошибки не глотать (Bull сам повторит попытку).
3. В `src/jobs/queues.ts` создать очередь и вызвать `queue.process(jobName, processor)`.
4. В `src/jobs/index.ts` добавить импорт процессора и хелпер `schedule…`, при необходимости — `repeat: { cron }`.
5. Если задачу нужно видеть в мониторинге — расширить `src/app/api/jobs/route.ts`.
