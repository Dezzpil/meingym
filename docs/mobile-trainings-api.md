# Mobile API: Trainings

Эндпоинты для синхронизации тренировок между мобильным приложением и сервером.

- Базовый URL: `https://<host>/api/mobile/v1`
- Все даты передаются в формате ISO 8601 (например, `2026-08-06T12:00:00.000Z`).

## Аутентификация

Все запросы требуют заголовок:

```
Authorization: Bearer <mobile-jwt-token>
```

Получить JWT-токен можно через эндпоинт:

```
POST /api/mobile/v1/auth/exchange
```

Обмен происходит по email + HMAC-SHA256 подписи текущего timestamp. Пример генерации подписи:

```javascript
const crypto = require("crypto");
const email = "user@example.com".trim().toLowerCase();
const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto
  .createHmac("sha256", MOBILE_HMAC_SECRET)
  .update(`${email}:${timestamp}`)
  .digest("hex");
```

Тело запроса на обмен:

```json
{
  "email": "user@example.com",
  "timestamp": 1722945600,
  "signature": "..."
}
```

В ответе придут `token` и `expiresIn` (секунды).

---

## GET /trainings

Получение списка тренировок пользователя с пагинацией.

```
GET /api/mobile/v1/trainings?cursor=<cursor>&since=<since>
```

### Query параметры

| Параметр | Тип      | Обязательный | Описание                                                                 |
|----------|----------|--------------|--------------------------------------------------------------------------|
| `cursor` | integer  | Нет          | ID последней полученной тренировки. Следующая страница начнётся после него. |
| `since`  | ISO 8601 | Нет          | Нижняя граница по `plannedTo`. По умолчанию — 31 день назад. Не может быть раньше 1 месяца. |

### Пример запроса

```bash
curl -X GET "https://meingym.online/api/mobile/v1/trainings?since=2026-07-01T00:00:00.000Z&cursor=15" \
  -H "Authorization: Bearer <token>"
```

### Пример ответа (200 OK)

```json
{
  "meta": {
    "total": 25,
    "nextCursor": 25
  },
  "items": [
    {
      "id": 16,
      "plannedTo": "2026-08-06T10:00:00.000Z",
      "createdAt": "2026-08-05T20:00:00.000Z",
      "startedAt": "2026-08-06T10:05:00.000Z",
      "completedAt": "2026-08-06T11:15:00.000Z",
      "isCircuit": false,
      "withWarmUp": true,
      "timeScoreInMins": 70,
      "durationMins": 70,
      "difficultyScore": 12.5,
      "muscles": [
        {
          "muscleId": 1,
          "muscleTitle": "Грудные",
          "groupTitle": "Грудь",
          "asAgonyCnt": 2,
          "asSynerCnt": 1,
          "asStableCnt": 0
        }
      ],
      "exercises": [
        {
          "actionId": 42,
          "priority": 1,
          "isPassed": false,
          "rating": "OK",
          "planned": {
            "approaches": [
              { "id": 101, "priority": 0, "weight": 60, "count": 10, "isBoost": false },
              { "id": 102, "priority": 1, "weight": 70, "count": 8, "isBoost": true }
            ],
            "metrics": {
              "len": 2,
              "weightSum": 130,
              "weightMean": 65,
              "weightMax": 70,
              "countSum": 18,
              "countMean": 9
            }
          },
          "executed": {
            "approaches": [
              {
                "id": 201,
                "priority": 0,
                "plannedWeight": 60,
                "plannedCount": 10,
                "liftedWeight": 60,
                "liftedCount": 10,
                "isPassed": true,
                "rating": "OK",
                "technique": "OK",
                "cheating": "NO",
                "refusing": "NO",
                "burning": "NO",
                "executedAt": "2026-08-06T10:10:00.000Z",
                "extraCount": 0,
                "useBelt": false,
                "techniqueUpgrade": false
              }
            ],
            "skipped": [],
            "metrics": {
              "len": 1,
              "weightSum": 60,
              "weightMean": 60,
              "weightMax": 60,
              "countSum": 10,
              "countMean": 10
            }
          },
          "previousRatings": [
            { "rating": "EASY", "date": "2026-08-04T10:00:00.000Z" },
            { "rating": "OK", "date": "2026-08-02T10:00:00.000Z" }
          ]
        }
      ]
    }
  ]
}
```

### Описание полей

#### Training

| Поле            | Тип      | Описание                                      |
|-----------------|----------|-----------------------------------------------|
| `id`            | integer  | Внутренний ID тренировки на сервере           |
| `plannedTo`     | ISO 8601 | Запланированная дата и время                  |
| `createdAt`     | ISO 8601 | Дата создания на сервере                      |
| `startedAt`     | ISO 8601 \| null | Время начала тренировки               |
| `completedAt`   | ISO 8601 \| null | Время завершения тренировки           |
| `isCircuit`     | boolean  | Тренировка в круговом режиме                  |
| `withWarmUp`    | boolean  | `true`, если разминка включена (`!noWarmUp`)  |
| `timeScoreInMins` | number | Время тренировки в минутах (из счетчика)      |
| `durationMins`  | number \| null | Разница `completedAt - startedAt` в минутах |
| `difficultyScore` | number | Оценка сложности тренировки                 |
| `muscles`       | array    | Статистика по мышцам                          |
| `exercises`     | array    | Упражнения тренировки                         |

#### Exercise

| Поле            | Тип     | Описание                                                   |
|-----------------|---------|------------------------------------------------------------|
| `actionId`      | integer | ID упражнения (связь со справочником `/api/mobile/v1/exercises`) |
| `priority`      | integer | Порядок упражнения в тренировке                            |
| `isPassed`      | boolean | Помечено ли упражнение как пройденное                      |
| `rating`        | string \| null | Оценка упражнения: `EASY`, `OK`, `HARD`, `IMPOSSIBLE` |
| `planned`       | object  | Запланированные подходы и метрики                          |
| `executed`      | object \| null | Выполненные подходы (пройденные и пропущенные)    |
| `previousRatings` | array \| null | История оценок этого упражнения до текущей тренировки |

#### Approach (planned)

| Поле       | Тип     | Описание                              |
|------------|---------|---------------------------------------|
| `id`       | integer | ID подхода                            |
| `priority` | integer | Порядок подхода                       |
| `weight`   | number  | Вес                                   |
| `count`    | integer | Количество повторений                 |
| `isBoost`  | boolean | Флаг буст-подхода                     |

#### Execution (executed)

| Поле             | Тип            | Описание                                                                 |
|------------------|----------------|--------------------------------------------------------------------------|
| `id`             | integer        | ID выполнения                                                            |
| `priority`       | integer        | Порядок выполнения                                                       |
| `plannedWeight`  | number         | Запланированный вес                                                      |
| `plannedCount`   | integer        | Запланированное количество повторений                                    |
| `liftedWeight`   | number         | Фактический вес                                                          |
| `liftedCount`    | integer        | Фактическое количество повторений                                        |
| `isPassed`       | boolean        | Подход пройден                                                           |
| `rating`         | string         | `EASY`, `OK`, `TENSION`, `HARD`                                          |
| `technique`      | string         | `OK`, `FLAW`                                                             |
| `cheating`       | string         | `NO`, `PART`, `FULL`                                                     |
| `refusing`       | string         | `NO`, `SOON`, `YES`                                                      |
| `burning`        | string         | `NO`, `YES`                                                              |
| `executedAt`     | ISO 8601 \| null | Время выполнения подхода                                                 |
| `extraCount`     | integer        | Дополнительные повторения                                                |
| `useBelt`        | boolean        | Использован пояс                                                         |
| `techniqueUpgrade` | boolean      | Повышение техники                                                        |

### Ошибки

| Статус | Тело ответа                                            | Причина                              |
|--------|--------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`              | Токен невалиден или истёк            |
| 400    | `{ "error": "cursor must be a positive integer" }`     | `cursor` не положительное целое число |
| 400    | `{ "error": "since must be a valid ISO 8601 datetime" }` | Невалидный формат даты               |
| 400    | `{ "error": "since must not be older than 1 month" }`  | `since` раньше 31 дня                |
| 500    | `{ "error": "Internal server error" }`                 | Внутренняя ошибка сервера            |

---

## POST /trainings

Синхронизация (создание/обновление) тренировок с мобильного приложения.

```
POST /api/mobile/v1/trainings
```

### Ограничения

- Массив `trainings` обязателен и не может быть пустым.
- Максимальный размер батча: **20 тренировок** за запрос.
- Если тренировка с таким `externalId` уже существует и имеет `completedAt !== null`, она пропускается (`skipped`).
- Если тренировка существует, но ещё не завершена, дочерние записи пересоздаются (update path).

### Тело запроса

```json
{
  "trainings": [
    {
      "externalId": "mobile-training-001",
      "plannedTo": "2026-08-06T10:00:00.000Z",
      "startedAt": "2026-08-06T10:05:00.000Z",
      "completedAt": "2026-08-06T11:15:00.000Z",
      "isCircuit": false,
      "noWarmUp": false,
      "noFeedback": false,
      "equipmentId": 1,
      "commonComment": null,
      "completeComment": "Хорошая тренировка",
      "periodId": null,
      "repeatedFromId": null,
      "exercises": [
        {
          "actionId": 42,
          "priority": 1,
          "purpose": "MASS",
          "isPassed": true,
          "rating": "OK",
          "comment": null,
          "startedAt": "2026-08-06T10:05:00.000Z",
          "completedAt": "2026-08-06T10:30:00.000Z",
          "approaches": [
            { "priority": 0, "weight": 60, "count": 10, "isBoost": false },
            { "priority": 1, "weight": 70, "count": 8, "isBoost": true }
          ],
          "executions": [
            {
              "priority": 0,
              "plannedWeight": 60,
              "plannedCount": 10,
              "liftedWeight": 60,
              "liftedCount": 10,
              "isPassed": true,
              "rating": "OK",
              "technique": "OK",
              "cheating": "NO",
              "refusing": "NO",
              "burning": "NO",
              "executedAt": "2026-08-06T10:10:00.000Z",
              "extraCount": 0,
              "useBelt": false,
              "techniqueUpgrade": false,
              "comment": null
            }
          ]
        }
      ]
    }
  ]
}
```

### Поля Training (sync input)

| Поле             | Тип            | Обязательный | Описание                                      |
|------------------|----------------|--------------|-----------------------------------------------|
| `externalId`     | string         | Да           | Уникальный ID тренировки на клиенте           |
| `plannedTo`      | ISO 8601       | Да           | Запланированная дата и время                  |
| `startedAt`      | ISO 8601 \| null | Нет        | Время начала                                  |
| `completedAt`    | ISO 8601 \| null | Нет        | Время завершения                              |
| `isCircuit`      | boolean        | Нет          | Круговая тренировка (по умолчанию `false`)    |
| `noWarmUp`       | boolean        | Нет          | Без разминки (по умолчанию `false`)           |
| `noFeedback`     | boolean        | Нет          | Не запрашивать обратную связь (по умолчанию `false`) |
| `equipmentId`    | integer \| null | Нет         | ID комплекта оборудования                     |
| `commonComment`  | string \| null | Нет         | Общий комментарий                             |
| `completeComment`| string \| null | Нет         | Комментарий после завершения                  |
| `periodId`       | integer \| null | Нет         | ID тренировочного периода                     |
| `repeatedFromId` | integer \| null | Нет         | ID исходной тренировки, если это повтор       |
| `exercises`      | array          | Да           | Список упражнений                             |

### Поля Exercise (sync input)

| Поле          | Тип            | Обязательный | Описание                                                   |
|---------------|----------------|--------------|------------------------------------------------------------|
| `actionId`    | integer        | Да           | ID упражнения из справочника                               |
| `priority`    | integer        | Да           | Порядок упражнения                                         |
| `purpose`     | string         | Да           | `MASS`, `STRENGTH`, `LOSS`                                 |
| `isPassed`    | boolean        | Да           | Упражнение пройдено                                        |
| `rating`      | string         | Нет          | `EASY`, `OK`, `HARD`, `IMPOSSIBLE` (по умолчанию `OK`)     |
| `comment`     | string \| null | Нет          | Комментарий к упражнению                                   |
| `startedAt`   | ISO 8601 \| null | Нет        | Время начала упражнения                                    |
| `completedAt` | ISO 8601 \| null | Нет        | Время завершения упражнения                                |
| `approaches`  | array          | Да           | Запланированные подходы                                    |
| `executions`  | array          | Да           | Выполненные подходы                                        |

### Поля Approach (sync input)

| Поле       | Тип     | Обязательный | Описание                              |
|------------|---------|--------------|---------------------------------------|
| `priority` | integer | Да           | Порядок подхода                       |
| `weight`   | number  | Да           | Вес                                   |
| `count`    | integer | Да           | Количество повторений                 |
| `isBoost`  | boolean | Нет          | Буст-подход (по умолчанию `false`)    |

### Поля Execution (sync input)

| Поле             | Тип            | Обязательный | Описание                                                   |
|------------------|----------------|--------------|------------------------------------------------------------|
| `priority`       | integer        | Да           | Порядок выполнения                                         |
| `plannedWeight`  | number         | Да           | Запланированный вес                                        |
| `plannedCount`   | integer        | Да           | Запланированное количество повторений                      |
| `liftedWeight`   | number         | Да           | Фактический вес                                            |
| `liftedCount`    | integer        | Да           | Фактическое количество повторений                          |
| `isPassed`       | boolean        | Нет          | Подход пройден (по умолчанию `false`)                      |
| `rating`         | string         | Нет          | `EASY`, `OK`, `TENSION`, `HARD` (по умолчанию `OK`)        |
| `technique`      | string         | Нет          | `OK`, `FLAW` (по умолчанию `OK`)                           |
| `cheating`       | string         | Нет          | `NO`, `PART`, `FULL` (по умолчанию `NO`)                   |
| `refusing`       | string         | Нет          | `NO`, `SOON`, `YES` (по умолчанию `NO`)                    |
| `burning`        | string         | Нет          | `NO`, `YES` (по умолчанию `NO`)                            |
| `executedAt`     | ISO 8601 \| null | Нет        | Время выполнения                                           |
| `extraCount`     | integer        | Нет          | Дополнительные повторения (по умолчанию `0`)               |
| `useBelt`        | boolean        | Нет          | Использован пояс (по умолчанию `false`)                    |
| `techniqueUpgrade`| boolean       | Нет          | Повышение техники (по умолчанию `false`)                   |
| `comment`        | string \| null | Нет          | Комментарий к подходу                                      |

### Пример ответа (200 OK)

```json
{
  "results": [
    {
      "externalId": "mobile-training-001",
      "status": "created",
      "trainingId": 42
    },
    {
      "externalId": "mobile-training-002",
      "status": "updated",
      "trainingId": 43
    },
    {
      "externalId": "mobile-training-003",
      "status": "skipped",
      "reason": "already_completed"
    },
    {
      "externalId": "mobile-training-004",
      "status": "error",
      "error": "Action not found"
    }
  ]
}
```

### Возможные статусы результата

| Статус    | Описание                                                   |
|-----------|------------------------------------------------------------|
| `created` | Тренировка создана                                         |
| `updated` | Существующая незавершённая тренировка обновлена            |
| `skipped` | Тренировка пропущена (уже завершена)                       |
| `error`   | Ошибка при обработке конкретной тренировки; остальные продолжают обрабатываться |

### Ошибки

| Статус | Тело ответа                                              | Причина                              |
|--------|----------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`                | Токен невалиден или истёк            |
| 400    | `{ "error": "Request body must contain a 'trainings' array" }` | Тело запроса не содержит `trainings` |
| 400    | `{ "error": "trainings array must not be empty" }`       | Массив `trainings` пуст              |
| 413    | `{ "error": "Maximum 20 trainings per request" }`        | Превышен лимит батча                 |
| 500    | `{ "error": "Internal server error" }`                   | Внутренняя ошибка сервера            |

---

## Связанные эндпоинты

| Эндпоинт                        | Описание                                   |
|----------------------------------|--------------------------------------------|
| `POST /api/mobile/v1/auth/exchange` | Получение JWT-токена                       |
| `POST /api/mobile/v1/auth/register` | Регистрация нового пользователя            |
| `GET /api/mobile/v1/me`          | Информация о текущем пользователе          |
| `GET /api/mobile/v1/exercises`   | Справочник упражнений (`actionId`)         |

---

## Запуск тестов

Тесты эндпоинта находятся в:

```
src/tests/mobile/trainings-route.test.ts
```

Запуск (требуется флаг экспериментального мокирования модулей):

```bash
node --experimental-test-module-mocks --import tsx --test src/tests/mobile/trainings-route.test.ts
```
