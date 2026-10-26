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

В ответе придут `token` и `expiresIn` (секунды). Это HS256 JWT с `sub = userId`; проверка — в `src/mobile/tools/jwt.ts`.

### POST /auth/register

Регистрация нового пользователя с тем же HMAC-подписанием. Требует серверный токен приложения: заголовок `x-app-token` (или поле `appToken` в теле) должен совпадать с `MOBILE_APP_TOKEN`.

```
POST /api/mobile/v1/auth/register
```

```json
{
  "email": "user@example.com",
  "timestamp": 1722945600,
  "signature": "...",
  "name": "Иван"
}
```

`name` необязателен. Успешный ответ — `201` с `{ token, expiresIn, userId }`: пользователь создаётся вместе с профилем и набором оборудования по умолчанию, токен выдаётся сразу. Если `email` уже занят — `409` с `{ "error": "USER_ALREADY_EXISTS" }`.

### Переменные окружения

| Переменная | Назначение | Если не задана |
|---|---|---|
| `MOBILE_HMAC_SECRET` | ключ HMAC-SHA256-подписи `email:timestamp` | запросы `exchange`/`register` падают с 500 |
| `MOBILE_JWT_SECRET` | ключ подписи и проверки JWT | ошибки авторизации с 500 |
| `MOBILE_JWT_EXPIRES_IN_SECONDS` | время жизни токена | 3600 |
| `MOBILE_TIMESTAMP_WINDOW_SECONDS` | допустимое отклонение timestamp | 300 |
| `MOBILE_APP_TOKEN` | ожидаемый `x-app-token` при регистрации | `register` отвечает 403 `INVALID_APP_TOKEN` |

### Ошибки

Ответ всегда содержит поле `error`:

| Код | HTTP | Когда |
|---|---|---|
| `TIMESTAMP_EXPIRED` | 401 | timestamp вне окна `MOBILE_TIMESTAMP_WINDOW_SECONDS` |
| `INVALID_SIGNATURE` | 401 | подпись не совпала с HMAC от `email:timestamp` |
| `USER_NOT_FOUND` | 401 | пользователя с таким email нет (для `exchange`) |
| `USER_ALREADY_EXISTS` | 409 | email уже зарегистрирован (для `register`) |
| `INVALID_APP_TOKEN` | 403 | `x-app-token` не задан или не совпал |

Ошибки проверки JWT роуты отдают сообщением, а не кодом: `Authorization header with Bearer token is required` (401, заголовка нет) и `Invalid or expired token` (401, токен просрочен или подписан другим ключом).

---

## GET /me

Полная информация о текущем пользователе и его профиле.

```
GET /api/mobile/v1/me
```

### Пример запроса

```bash
curl -X GET "https://meingym.online/api/mobile/v1/me" \
  -H "Authorization: Bearer <token>"
```

### Пример ответа (200 OK)

```json
{
  "id": "clxxxxxxxxxxxxxxxxxxxxx",
  "email": "user@example.com",
  "name": "Иван",
  "role": "USER",
  "image": null,
  "emailVerified": null,
  "createdAt": "2026-01-10T12:00:00.000Z",
  "updatedAt": "2026-08-06T09:30:00.000Z",
  "userInfo": {
    "sex": "MALE",
    "height": 175,
    "purpose": "STRENGTH",
    "trainingProgression": "SIMPLE",
    "trainingProgressionParams": {},
    "collectExerciseExecutionFeedback": false
  }
}
```

### Описание полей

| Поле            | Тип              | Описание                                                        |
|-----------------|------------------|-----------------------------------------------------------------|
| `id`            | string           | Внутренний ID пользователя                                       |
| `email`         | string           | Email (нормализован: trim + нижний регистр)                      |
| `name`          | string \| null   | Имя пользователя                                                 |
| `role`          | string           | Роль: `USER`, `ADMIN`                                            |
| `image`         | string \| null   | URL аватара                                                      |
| `emailVerified` | ISO 8601 \| null | Дата подтверждения email                                         |
| `createdAt`     | ISO 8601         | Дата создания пользователя                                       |
| `updatedAt`     | ISO 8601         | Дата последнего обновления                                       |
| `userInfo`      | object \| null   | Профиль пользователя (`null`, если профиль ещё не создан)        |

#### userInfo

| Поле                              | Тип     | Описание                                                       |
|-----------------------------------|---------|----------------------------------------------------------------|
| `sex`                             | string  | Пол: `MALE`, `FEMALE`                                           |
| `height`                          | integer | Рост в сантиметрах                                              |
| `purpose`                         | string  | Глобальная цель: `MASS`, `STRENGTH`, `LOSS`                     |
| `trainingProgression`             | string  | Стратегия прогрессии: `NONE`, `SIMPLE`                          |
| `trainingProgressionParams`       | object  | Параметры прогрессии (JSON)                                     |
| `collectExerciseExecutionFeedback`| boolean | Собирать ли обратную связь по выполнениям упражнений            |

> Поле `password` намеренно исключено из ответа и никогда не отдаётся через API.

### Ошибки

| Статус | Тело ответа                                            | Причина                              |
|--------|--------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`              | Токен невалиден или истёк            |
| 404    | `{ "error": "User not found" }`                        | Пользователь не найден               |
| 500    | `{ "error": "Internal server error" }`                 | Внутренняя ошибка сервера            |

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
          "isDurationBased": false,
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
| `isDurationBased` | boolean | Упражнение «на длительность» — см. раздел [Упражнения на длительность](#упражнения-на-длительность-duration-based). Для таких упражнений `weight`/`count` в подходах и выполнениях имеют другой смысл |
| `rating`        | string \| null | Оценка упражнения: `EASY`, `OK`, `HARD`, `IMPOSSIBLE` |
| `planned`       | object  | Запланированные подходы и метрики                          |
| `executed`      | object \| null | Выполненные подходы (пройденные и пропущенные)    |
| `previousRatings` | array \| null | История оценок этого упражнения до текущей тренировки |

#### Approach (planned)

| Поле       | Тип     | Описание                              |
|------------|---------|---------------------------------------|
| `id`       | integer | ID подхода                            |
| `priority` | integer | Порядок подхода                       |
| `weight`   | number  | Вес. Для duration-упражнений — значение параметра сложности (`0`, если параметра нет) |
| `count`    | integer | Количество повторений. Для duration-упражнений — длительность в секундах |
| `isBoost`  | boolean | Флаг буст-подхода                     |

#### Execution (executed)

| Поле             | Тип            | Описание                                                                 |
|------------------|----------------|--------------------------------------------------------------------------|
| `id`             | integer        | ID выполнения                                                            |
| `priority`       | integer        | Порядок выполнения                                                       |
| `plannedWeight`  | number         | Запланированный вес. Для duration — запланированный параметр сложности    |
| `plannedCount`   | integer        | Запланированное количество повторений. Для duration — planned длительность, с |
| `liftedWeight`   | number         | Фактический вес. Для duration — фактический параметр сложности            |
| `liftedCount`    | integer        | Фактическое количество повторений. Для duration — фактическая длительность, с |
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

## POST /trainings/scores

Предварительные оценки тренировки — **время** и **сложность** — по упражнениям, которые приложение собирается в неё включить. Метод ничего не создаёт и не изменяет на сервере: это чистый расчёт, чтобы показать оценки до сохранения тренировки.

```
POST /api/mobile/v1/trainings/scores
```

### Ограничения

- Массив `exercises` обязателен и не может быть пустым.
- Максимальный размер: **50 упражнений** за запрос.
- `id` — это `actionId` из справочника `GET /api/mobile/v1/exercises`; неизвестные ID приводят к ошибке 400.
- `approaches` не может быть пустым: количество подходов определяет время, веса и повторения — сложность.
- Оценки считаются по тем же формулам, что и на сервере при сохранении тренировки:
  - время упражнения = норматив цели (мин на подход) × количество подходов; нормативы: `STRENGTH` — 5, `MASS` — 3.5, `LOSS` — 2;
  - сложность упражнения = `base` упражнения × предварительная оценка подходов по цели;
  - оценки тренировки = суммы оценок её упражнений.
- Для упражнений «на длительность» (`isDurationBased`) цель принудительно берётся как `LOSS` — см. [Упражнения на длительность](#упражнения-на-длительность-duration-based). Переданный `purpose` при этом игнорируется, в ответе возвращается фактическая цель.
- Для упражнений с собственным весом (`rig = OTHER`) в статистике подходов участвует последняя запись веса пользователя; если записей веса нет, вернётся 400.

### Тело запроса

```json
{
  "exercises": [
    {
      "id": 42,
      "purpose": "MASS",
      "approaches": [
        { "weight": 60, "count": 10 },
        { "weight": 70, "count": 8 }
      ]
    },
    {
      "id": 17,
      "purpose": "STRENGTH",
      "approaches": [
        { "weight": 100, "count": 5 },
        { "weight": 110, "count": 3 }
      ]
    }
  ]
}
```

### Поля Exercise (input)

| Поле        | Тип     | Обязательный | Описание                                        |
|-------------|---------|--------------|-------------------------------------------------|
| `id`        | integer | Да           | ID упражнения (`actionId`) из справочника        |
| `purpose`   | string  | Да           | `MASS`, `STRENGTH`, `LOSS`                       |
| `approaches`| array   | Да           | Подходы упражнения (минимум один)                |

### Поля Approach (input)

| Поле       | Тип     | Обязательный | Описание                                                                       |
|------------|---------|--------------|--------------------------------------------------------------------------------|
| `weight`   | number  | Да           | Вес ≥ 0. Для duration-упражнений — параметр сложности                           |
| `count`    | integer | Да           | Количество повторений > 0. Для duration-упражнений — длительность в секундах    |
| `priority` | integer | Нет          | Порядок подхода (на расчёт не влияет)                                           |
| `isBoost`  | boolean | Нет          | Флаг буст-подхода (на расчёт не влияет)                                         |

### Пример ответа (200 OK)

```json
{
  "timeScoreInMins": 17,
  "timeScoreInSecs": 1020,
  "difficultyScore": 14.62,
  "exercises": [
    {
      "id": 42,
      "purpose": "MASS",
      "approachesCount": 2,
      "timeScoreInMins": 7,
      "timeScoreInSecs": 420,
      "difficultyScore": 8.93
    },
    {
      "id": 17,
      "purpose": "STRENGTH",
      "approachesCount": 2,
      "timeScoreInMins": 10,
      "timeScoreInSecs": 600,
      "difficultyScore": 5.69
    }
  ]
}
```

### Описание полей ответа

| Поле              | Тип    | Описание                                                |
|-------------------|--------|---------------------------------------------------------|
| `timeScoreInMins` | number | Оценка времени всей тренировки в минутах                 |
| `timeScoreInSecs` | number | То же в секундах                                         |
| `difficultyScore` | number | Оценка сложности всей тренировки                         |
| `exercises`       | array  | Оценки по каждому упражнению в порядке передачи         |

#### Exercise (scores)

| Поле              | Тип     | Описание                                                             |
|-------------------|---------|----------------------------------------------------------------------|
| `id`              | integer | ID упражнения (`actionId`)                                            |
| `purpose`         | string  | Фактическая цель расчёта (`LOSS` для duration-упражнений)             |
| `approachesCount` | integer | Количество учтённых подходов                                          |
| `timeScoreInMins` | number  | Оценка времени упражнения в минутах                                   |
| `timeScoreInSecs` | number  | То же в секундах                                                      |
| `difficultyScore` | number  | Оценка сложности упражнения                                           |

### Ошибки

| Статус | Тело ответа                                              | Причина                              |
|--------|----------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`                | Токен невалиден или истёк            |
| 400    | `{ "error": "Request body must contain an 'exercises' array" }` | Тело запроса не содержит `exercises` |
| 400    | `{ "error": "exercises array must not be empty" }`       | Массив `exercises` пуст              |
| 413    | `{ "error": "Maximum 50 exercises per request" }`        | Превышен лимит упражнений            |
| 400    | `{ "error": "exercises[0].purpose: Invalid enum value..." }` | Невалидное поле упражнения или подхода (в сообщении — путь к полю и причина) |
| 400    | `{ "error": "Unknown exercise ids: 42, 17" }`            | Упражнений с такими ID нет в справочнике |
| 400    | `{ "error": "User has no weight records required for bodyweight exercises" }` | Нет записи веса для упражнений с собственным весом |
| 500    | `{ "error": "Internal server error" }`                   | Внутренняя ошибка сервера            |

---

## Упражнения на длительность (duration-based)

Некоторые упражнения измеряются не «вес × повторения», а **длительностью** (беговая дорожка, планка, велосипед и т.п.). Они помечаются флагом `isDurationBased` в справочнике и в ответе `GET /trainings`.

### Семантика полей

Для duration-упражнений колонки `weight`/`count` переиспользуются:

| Поле     | Обычное упражнение    | Duration-упражнение                                             |
|----------|-----------------------|-----------------------------------------------------------------|
| `count`  | количество повторений | **длительность в секундах**                                      |
| `weight` | вес (кг)              | **параметр сложности** (наклон/скорость/режим); `0`, если параметра нет |

Правило действует для подходов (`planned.approaches`), выполнений (`executed.approaches`, `executed.skipped`) и для тела `POST /trainings` (`approaches`, `executions`, включая `plannedWeight`/`plannedCount`/`liftedWeight`/`liftedCount`).

Метрики (`metrics`) для duration-упражнений:

- `countSum` — суммарная длительность, с;
- `countMean` — средняя длительность, с;
- `weightMax` — максимальный параметр сложности;
- `weightMean` — средний параметр сложности;
- `weightSum` — Σ (параметр × длительность).

### Поля справочника `GET /api/mobile/v1/exercises`

| Поле                 | Тип            | Описание                                                             |
|----------------------|----------------|----------------------------------------------------------------------|
| `isDurationBased`    | boolean        | `true`, если упражнение измеряется длительностью                       |
| `durationParamLabel` | string \| null | Название параметра сложности (например, «Наклон»); `null`, если параметра нет |
| `durationParamUnit`  | string \| null | Единицы параметра (например, «%», «км/ч»); `null`, если параметра нет   |

Наличие параметра определяется как `durationParamLabel != null`.

### Синхронизация (`POST /trainings`)

- Цель (`purpose`) duration-упражнений на сервере принудительно устанавливается в `LOSS`; переданное значение `purpose` игнорируется.
- Структура подходов/выполнений не меняется: длительность передаётся в `count`, параметр — в `weight`.
- Поля обратной связи `cheating`, `useBelt`, `extraCount` для duration-упражнений не несут смысла (допустимо передавать значения по умолчанию).

---

## Связанные эндпоинты

| Эндпоинт                        | Описание                                   |
|----------------------------------|--------------------------------------------|
| `POST /api/mobile/v1/auth/exchange` | Получение JWT-токена                       |
| `POST /api/mobile/v1/auth/register` | Регистрация нового пользователя            |
| `GET /api/mobile/v1/me`          | Информация о текущем пользователе          |
| `GET /api/mobile/v1/exercises`   | Справочник упражнений (`actionId`)         |
| `POST /api/mobile/v1/trainings/scores` | Предварительные оценки времени и сложности тренировки |
| `GET /api/mobile/v1/trainings/dynamics` | Динамика тренировок (относительная сложность) |
| `GET /api/mobile/v1/trainings/muscle-load` | Нагрузка по группам мышц за период      |
| `GET /api/mobile/v1/weights`     | Список весов пользователя                  |
| `POST /api/mobile/v1/weights`    | Пакетное добавление весов                   |
| `GET /api/mobile/v1/records`     | Персональные рекорды пользователя           |
| `GET /api/mobile/v1/soreness/awaiting` | Тренировка, ожидающая оценку крепатуры  |
| `POST /api/mobile/v1/soreness`   | Создать/обновить запись о крепатуре        |
| `GET /api/mobile/v1/soreness/suggestions` | Предложения упражнений для недостаточно нагруженных мышц |
| `GET /api/mobile/v1/checkup/settings` | Настройки чекапов пользователя          |
| `PUT /api/mobile/v1/checkup/settings` | Обновить настройки чекапов              |
| `GET /api/mobile/v1/checkup`     | История чекапов с пагинацией               |
| `GET /api/mobile/v1/checkup/:trainingId` | Чекап для конкретной тренировки      |
| `POST /api/mobile/v1/checkup`    | Создать/обновить чекап                     |

---

## Запуск тестов

Тесты эндпоинтов находятся в:

```
src/tests/mobile/trainings-route.test.ts   # GET/POST /trainings
src/tests/mobile/syncTrainings.test.ts     # логика синхронизации
src/tests/mobile/scores-route.test.ts      # POST /trainings/scores (валидация, авторизация)
src/tests/mobile/scores.test.ts            # POST /trainings/scores (расчёт оценок)
src/tests/mobile/records-route.test.ts     # GET /records (авторизация, валидация параметров)
src/tests/mobile/records.test.ts           # GET /records (выборка, пагинация, маппинг)
```

Запуск всех тестов мобильного API (требуется флаг экспериментального мокирования модулей):

```bash
npm run test:mobile
```

Запуск отдельного файла:

```bash
node --experimental-test-module-mocks --import tsx --test src/tests/mobile/scores-route.test.ts
```

---

## GET /weights

Получение списка весов пользователя с пагинацией.

```
GET /api/mobile/v1/weights?cursor=<cursor>&since=<since>
```

### Query параметры

| Параметр | Тип      | Обязательный | Описание                                                                 |
|----------|----------|--------------|--------------------------------------------------------------------------|
| `cursor` | integer  | Нет          | ID последней полученной записи. Следующая страница начнётся после него.   |
| `since`  | ISO 8601 | Нет          | Нижняя граница по `createdAt`. По умолчанию — 31 день назад. Ограничения по давности нет. |

### Пример запроса

```bash
curl -X GET "https://meingym.online/api/mobile/v1/weights?since=2026-07-01T00:00:00.000Z&cursor=10" \
  -H "Authorization: Bearer <token>"
```

### Пример ответа (200 OK)

```json
{
  "meta": {
    "total": 15,
    "nextCursor": 30
  },
  "items": [
    {
      "id": 11,
      "value": 75.5,
      "createdAt": "2026-07-15T08:00:00.000Z"
    },
    {
      "id": 12,
      "value": 75.2,
      "createdAt": "2026-07-16T08:00:00.000Z"
    }
  ]
}
```

### Описание полей

| Поле        | Тип      | Описание                              |
|-------------|----------|---------------------------------------|
| `id`        | integer  | Внутренний ID записи веса на сервере  |
| `value`     | number   | Вес в килограммах                     |
| `createdAt`| ISO 8601 | Дата и время записи                   |

### Ошибки

| Статус | Тело ответа                                            | Причина                              |
|--------|--------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`              | Токен невалиден или истёк            |
| 400    | `{ "error": "cursor must be a positive integer" }`     | `cursor` не положительное целое число |
| 400    | `{ "error": "since must be a valid ISO 8601 datetime" }` | Невалидный формат даты               |
| 500    | `{ "error": "Internal server error" }`                 | Внутренняя ошибка сервера            |

---

## POST /weights

Пакетное добавление весов пользователя.

```
POST /api/mobile/v1/weights
```

### Ограничения

- Массив `weights` обязателен и не может быть пустым.
- Максимальный размер батча: **50 записей** за запрос.
- Поле `createdAt` опционально; если не указано, используется текущее время сервера.
- `value` должен быть положительным конечным числом.
- `createdAt` не может быть в будущем.

### Тело запроса

```json
{
  "weights": [
    {
      "value": 75.5,
      "createdAt": "2026-08-09T10:00:00.000Z"
    },
    {
      "value": 75.2,
      "createdAt": "2026-08-08T10:00:00.000Z"
    },
    {
      "value": 74.8
    }
  ]
}
```

### Поля Weight (input)

| Поле        | Тип      | Обязательный | Описание                                      |
|-------------|----------|--------------|-----------------------------------------------|
| `value`     | number   | Да           | Вес в килограммах (положительное число)        |
| `createdAt`| ISO 8601 | Нет          | Дата и время записи (по умолчанию текущее время) |

### Пример ответа (200 OK)

```json
{
  "created": 3
}
```

> Метод возвращает только количество созданных записей. Полные записи можно получить через `GET /weights`.

### Ошибки

| Статус | Тело ответа                                              | Причина                              |
|--------|----------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`                | Токен невалиден или истёк            |
| 400    | `{ "error": "Request body must contain a 'weights' array" }` | Тело запроса не содержит `weights` |
| 400    | `{ "error": "weights array must not be empty" }`       | Массив `weights` пуст              |
| 413    | `{ "error": "Maximum 50 weights per request" }`        | Превышен лимит батча                 |
| 400    | `{ "error": "weights[i].value must be a positive finite number" }` | Невалидное значение веса |
| 400    | `{ "error": "weights[i].createdAt must be a valid ISO 8601 datetime" }` | Невалидный формат даты |
| 400    | `{ "error": "weights[i].createdAt must not be in the future" }` | Дата в будущем |
| 500    | `{ "error": "Internal server error" }`                   | Внутренняя ошибка сервера            |

---

## GET /records

Получение персональных рекордов пользователя с пагинацией.

```
GET /api/mobile/v1/records?cursor=<cursor>&since=<since>
```

Рекорды — производные данные: сервер фиксирует их после завершения тренировки и пересчитывает при изменении истории. Метод отдаёт **все** записи пользователя — абсолютные (`isAllTime = true`) и периодические, включая «базу» (первый результат в истории или в периоде, `previousValue = null`). Нужные записи клиент отбирает сам — см. [Действующие рекорды на клиенте](#действующие-рекорды-на-клиенте).

### Query параметры

| Параметр | Тип      | Обязательный | Описание                                                                 |
|----------|----------|--------------|--------------------------------------------------------------------------|
| `cursor` | integer  | Нет          | ID последней полученной записи. Следующая страница начнётся после него.   |
| `since`  | ISO 8601 | Нет          | Нижняя граница по `achievedAt` (момент завершения тренировки, в которой установлен рекорд). По умолчанию — 31 день назад. Ограничения по давности нет: для полной истории передайте раннюю дату, например `1970-01-01T00:00:00.000Z`. |

Размер страницы — **50 записей**; признак следующей страницы — `meta.nextCursor !== null`.

### Пример запроса

```bash
curl -X GET "https://meingym.online/api/mobile/v1/records?since=2026-07-01T00:00:00.000Z&cursor=120" \
  -H "Authorization: Bearer <token>"
```

### Пример ответа (200 OK)

```json
{
  "meta": {
    "total": 63,
    "nextCursor": 170
  },
  "items": [
    {
      "id": 121,
      "actionId": 42,
      "purpose": "MASS",
      "type": "MAX_WEIGHT",
      "isAllTime": true,
      "value": 100,
      "reps": 5,
      "periodId": null,
      "trainingId": 247,
      "trainingExerciseId": 1832,
      "achievedAt": "2026-08-06T11:15:00.000Z",
      "previousValue": 95,
      "previousTrainingId": 231,
      "previousAt": "2026-07-20T10:40:00.000Z",
      "createdAt": "2026-08-06T11:16:02.000Z"
    },
    {
      "id": 122,
      "actionId": 42,
      "purpose": "MASS",
      "type": "MAX_VOLUME",
      "isAllTime": true,
      "value": 2450,
      "reps": null,
      "periodId": null,
      "trainingId": 247,
      "trainingExerciseId": 1832,
      "achievedAt": "2026-08-06T11:15:00.000Z",
      "previousValue": null,
      "previousTrainingId": null,
      "previousAt": null,
      "createdAt": "2026-08-06T11:16:02.000Z"
    }
  ]
}
```

### Описание полей

| Поле                 | Тип              | Описание                                                                 |
|----------------------|------------------|--------------------------------------------------------------------------|
| `id`                 | integer          | Внутренний ID записи рекорда; используется как `cursor`. Меняется при пересчёте — см. примечание ниже |
| `actionId`           | integer          | ID упражнения (связь со справочником `GET /api/mobile/v1/exercises`)     |
| `purpose`            | string           | Цель: `MASS`, `STRENGTH`, `LOSS`                                          |
| `type`               | string           | `MAX_WEIGHT` — максимальный вес одного подхода; `MAX_VOLUME` — тоннаж (Σ вес × повторы за упражнение) |
| `isAllTime`          | boolean          | `true` — абсолютный рекорд за всё время, `false` — лучший результат периода |
| `value`              | number           | Значение рекорда в кг. Для упражнений «на длительность» — секунды         |
| `reps`               | integer \| null  | Повторы рекордного подхода — только для `MAX_WEIGHT` (показ «100 × 5»)     |
| `periodId`           | integer \| null  | ID тренировочного периода для периодических рекордов                      |
| `trainingId`         | integer          | ID тренировки, в которой установлен рекорд                                |
| `trainingExerciseId` | integer          | ID упражнения внутри тренировки                                           |
| `achievedAt`         | ISO 8601         | Когда установлен рекорд (= `completedAt` тренировки)                      |
| `previousValue`      | number \| null   | Прежний лучший результат той же связки; `null` — «база» (первый результат) |
| `previousTrainingId` | integer \| null  | Тренировка прежнего рекорда                                               |
| `previousAt`         | ISO 8601 \| null | Дата прежнего рекорда                                                     |
| `createdAt`          | ISO 8601         | Дата создания записи на сервере; меняется при пересчёте                   |

> **Важно про стабильность записей.** При пересчёте рекордов записи тренировки удаляются и создаются заново, поэтому `id` и `createdAt` конкретного рекорда могут меняться. Устойчивый «адрес» рекорда — связка `actionId` + `purpose` + `type` + `isAllTime` + `periodId` + `achievedAt`. Инкрементальную синхронизацию рекомендуется вести по `achievedAt`, а при получении записи с неизвестной связкой — заменять локальную, а не добавлять ещё одну.

### Действующие рекорды на клиенте

Сервер отдаёт сырой набор записей; представления веб-приложения получаются так:

- **действующие рекорды**: `isAllTime = true`, по одной последней записи (максимум `achievedAt`, при равенстве — больший `id`) на связку `actionId` + `purpose` + `type`;
- **история улучшений**: `previousValue !== null`, прирост = `value - previousValue`;
- **«база»** (`previousValue = null`) — первый результат в истории или в периоде, служебная запись: обычно не показывается;
- упражнения «на длительность» (`isDurationBased` из справочника) дают только `MAX_VOLUME`, где `value` — суммарная длительность в секундах, см. [Упражнения на длительность](#упражнения-на-длительность-duration-based).

### Ошибки

| Статус | Тело ответа                                            | Причина                              |
|--------|--------------------------------------------------------|--------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации    |
| 401    | `{ "error": "Invalid or expired token" }`              | Токен невалиден или истёк            |
| 400    | `{ "error": "cursor must be a positive integer" }`     | `cursor` не положительное целое число |
| 400    | `{ "error": "since must be a valid ISO 8601 datetime" }` | Невалидный формат даты               |
| 500    | `{ "error": "Internal server error" }`                 | Внутренняя ошибка сервера            |

---

## Чекапы (Checkups)

Пре-тренировочные чекапы: оценка сна, питания, предтреника, стресса и опциональный скрининг проф. выгорания (BAT-4).

### GET /checkup/settings

Получить настройки чекапов пользователя.

**Ответ (200):**

```json
{
  "checkupsEnabled": true,
  "isEmployed": false
}
```

| Поле              | Тип       | Описание                                 |
|-------------------|-----------|------------------------------------------|
| `checkupsEnabled` | `boolean` | Показывать чекапы перед тренировкой      |
| `isEmployed`      | `boolean` | Показывать вопросы про выгорание (BAT-4) |

### PUT /checkup/settings

Обновить настройки чекапов. Оба поля опциональны — обновляются только переданные.

**Тело запроса:**

```json
{
  "checkupsEnabled": true,
  "isEmployed": true
}
```

**Ответ (200):** актуальные настройки (см. GET).

### GET /checkup

Получить историю чекапов с курсорной пагинацией.

**Параметры запроса:**

| Параметр | Тип | Обязательный | Описание                         |
|----------|-----|--------------|----------------------------------|
| `cursor` | int | нет          | ID последнего полученного чекапа |

**Ответ (200):**

```json
{
  "meta": { "total": 42, "nextCursor": 123 },
  "items": [
    {
      "id": 1,
      "trainingId": 100,
      "sleep": 4,
      "nutrition": 3,
      "preWorkout": 5,
      "stress": 2,
      "burnoutExhaustion": 3,
      "burnoutDistance": 2,
      "burnoutCognitive": 4,
      "burnoutEmotional": 1,
      "burnoutScore": 2.5,
      "difficultyChoice": "NORMAL",
      "createdAt": "2026-10-24T15:00:00.000Z"
    }
  ]
}
```

### GET /checkup/:trainingId

Получить чекап для конкретной тренировки.

**Ответ (200):** объект чекапа (см. выше).  
**Ответ (404):** `{ "error": "Checkup not found" }`

### POST /checkup

Создать или обновить чекап для тренировки.

**Тело запроса:**

```json
{
  "trainingId": 100,
  "sleep": 4,
  "nutrition": 3,
  "preWorkout": 5,
  "stress": 2,
  "burnoutExhaustion": 3,
  "burnoutDistance": 2,
  "burnoutCognitive": 4,
  "burnoutEmotional": 1,
  "difficultyChoice": "BOOST"
}
```

| Поле                | Тип                                         | Обязательный | Описание                      |
|---------------------|---------------------------------------------|--------------|-------------------------------|
| `trainingId`        | int (>0)                                    | да           | ID тренировки                 |
| `sleep`             | int (1–5)                                   | да           | Качество сна                  |
| `nutrition`         | int (1–5)                                   | да           | Качество питания              |
| `preWorkout`        | int (1–5)                                   | да           | Предтренировочное состояние   |
| `stress`            | int (1–5)                                   | да           | Уровень стресса               |
| `burnoutExhaustion` | int (1–5) \| null                           | нет          | BAT-4: ментальное истощение   |
| `burnoutDistance`   | int (1–5) \| null                           | нет          | BAT-4: дистанция              |
| `burnoutCognitive`  | int (1–5) \| null                           | нет          | BAT-4: когнитивное снижение   |
| `burnoutEmotional`  | int (1–5) \| null                           | нет          | BAT-4: эмоциональное снижение |
| `difficultyChoice`  | `"BOOST"` \| `"NORMAL"` \| `"EASY"` \| null | нет          | Выбор сложности тренировки    |

**Ответ (200):** созданный/обновлённый чекап.

### Ошибки чекапов

| Статус | Тело ответа                                                | Причина                             |
|--------|------------------------------------------------------------|-------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации |
| 401    | `{ "error": "Invalid or expired token" }`                  | Токен невалиден или истёк           |
| 400    | `{ "error": "trainingId must be a positive integer" }`     | `trainingId` не положительное целое |
| 400    | `{ "error": "sleep must be an integer between 1 and 5" }`  | Значение вне диапазона 1–5          |
| 404    | `{ "error": "Checkup not found" }`                         | Чекап не найден                     |
| 500    | `{ "error": "Internal server error" }`                     | Внутренняя ошибка сервера           |

---

## Крепатура (Soreness)

Оценка крепатуры после тренировок: пользователь указывает интенсивность боли в каждой задействованной мышце через 1–3 дня после тренировки.

### GET /soreness/awaiting

Получить тренировку, которая ожидает оценку крепатуры. Возвращает последнюю завершённую тренировку за последние 3 дня, для которой ещё не создана запись о крепатуре.

**Ответ (200):**

```json
{
  "data": {
    "id": 123,
    "completedAt": "2026-10-24T15:00:00.000Z",
    "daysAfter": 2,
    "muscles": [
      {
        "muscleId": 1,
        "muscleTitle": "Грудные",
        "groupTitle": "Грудь",
        "asAgonyCnt": 2,
        "asSynerCnt": 1
      }
    ]
  }
}
```

| Поле          | Тип              | Описание                                                                 |
|---------------|------------------|--------------------------------------------------------------------------|
| `id`          | int              | ID тренировки                                                            |
| `completedAt` | ISO 8601         | Время завершения тренировки                                              |
| `daysAfter`   | int              | Дней после тренировки (от 1 до 3)                                        |
| `muscles`     | array            | Список мышц,, задействованных в тренировке (агонисты и синергисты)       |

Если нет тренировок, ожидающих оценку, возвращается `{ "data": null }`.

### POST /soreness

Создать или обновить запись о крепатуре для тренировки.

**Тело запроса:**

```json
{
  "trainingId": 123,
  "entries": [
    { "muscleId": 1, "intensity": "MODERATE" },
    { "muscleId": 2, "intensity": "LIGHT" }
  ]
}
```

| Поле         | Тип     | Обязательный | Описание                                              |
|--------------|---------|--------------|-------------------------------------------------------|
| `trainingId` | int (>0)| да           | ID тренировки                                         |
| `entries`    | array   | да           | Список оценок крепатуры по мышкам (минимум 1 запись)  |

#### Entry

| Поле        | Тип     | Обязательный | Описание                                                         |
|-------------|---------|--------------|------------------------------------------------------------------|
| `muscleId`  | int (>0)| да           | ID мышцы                                                         |
| `intensity` | string  | да           | Интенсивность: `NONE`, `LIGHT`, `MODERATE`, `SEVERE`             |

**Ответ (200):** созданная/обновлённая запись о крепатуре.

```json
{
  "data": {
    "id": 456,
    "userId": "clxxxxxxxxxxxxxxxxxxxxx",
    "trainingId": 123,
    "daysAfter": 2,
    "createdAt": "2026-10-26T10:00:00.000Z",
    "Entries": [
      {
        "id": 789,
        "sorenessId": 456,
        "muscleId": 1,
        "intensity": "MODERATE",
        "Muscle": { "id": 1, "title": "Грудные" }
      }
    ]
  }
}
```

### GET /soreness/suggestions

Получить предложения по упражнениям для недостаточно нагруженных мышц. Анализирует последние 5 тренировок с данными о крепатуре и находит мышцы, которые тренировались минимум 2 раза, но в >50% случаев крепатура была низкой (`NONE` или `LIGHT`).

**Query параметры:**

| Параметр    | Тип | Обязательный | Описание                    |
|-------------|-----|--------------|-----------------------------|
| `trainingId`| int | да           | ID текущей тренировки       |

**Ответ (200):**

```json
{
  "data": {
    "muscles": [
      {
        "muscleId": 3,
        "muscleTitle": "Бицепс",
        "groupTitle": "Руки",
        "trainedCount": 4,
        "lowSorenessCount": 3
      }
    ],
    "exercises": [
      {
        "actionId": 15,
        "actionTitle": "Подъём штанги на бицепс",
        "actionAlias": "biceps-curl",
        "muscleId": 3
      }
    ]
  }
}
```

| Поле               | Тип     | Описание                                                        |
|--------------------|---------|-----------------------------------------------------------------|
| `muscles`          | array   | Список недостаточно нагруженных мышц                            |
| `muscles[].trainedCount` | int | Сколько раз мышца тренировалась за последние 5 тренировок     |
| `muscles[].lowSorenessCount` | int | Сколько раз крепатура была низкой                         |
| `exercises`        | array   | Список упражнений, нагружающих эти мышцы (агонисты)             |

### Ошибки крепатуры

| Статус | Тело ответа                                                | Причина                                    |
|--------|------------------------------------------------------------|--------------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации          |
| 401    | `{ "error": "Invalid or expired token" }`                  | Токен невалиден или истёк                  |
| 400    | `{ "error": "trainingId must be a positive integer" }`     | `trainingId` не положительное целое        |
| 400    | `{ "error": "Training is not completed" }`                 | Тренировка ещё не завершена                |
| 404    | `{ "error": "Training not found" }`                        | Тренировка не найдена                      |
| 500    | `{ "error": "Internal server error" }`                     | Внутренняя ошибка сервера                  |

---

## Динамика тренировок (Dynamics)

Анализ прогресса: относительная сложность тренировок, нагрузка по группам мышц, сравнение "подобных" тренировок.

### GET /trainings/dynamics

Получить динамику тренировок: относительная сложность каждой тренировки относительно среднего по тренировкам с той же подписью (набором задействованных мышц-агонистов).

**Query параметры:**

| Параметр | Тип      | Обязательный | Описание                                                                 |
|----------|----------|--------------|--------------------------------------------------------------------------|
| `since`  | ISO 8601 | Нет          | Нижняя граница по `plannedTo`. По умолчанию — 31 день назад.           |
| `limit`  | int      | Нет          | Максимальное количество тренировок (до 100). По умолчанию — 50.        |

**Ответ (200):**

```json
{
  "data": [
    {
      "trainingId": 123,
      "absoluteDifficulty": 45.6,
      "relativeToMean": 12.5,
      "meanDifficulty": 40.5,
      "sparkline": [38.2, 40.1, 42.3, 40.5, 45.6],
      "hasEnoughData": true
    }
  ],
  "meta": {
    "total": 1
  }
}
```

| Поле                   | Тип              | Описание                                                                 |
|------------------------|------------------|--------------------------------------------------------------------------|
| `trainingId`           | int              | ID тренировки                                                            |
| `absoluteDifficulty`   | number           | Абсолютная сложность тренировки                                          |
| `relativeToMean`       | number \| null   | Относительная сложность, % (+12.5 = на 12.5% сложнее среднего)          |
| `meanDifficulty`       | number \| null   | Средняя сложность тренировок с той же подписью (кроме текущей)           |
| `sparkline`            | number[]         | Последние 8 тренировок с той же подписью (от старой к новой)             |
| `hasEnoughData`        | boolean          | `true`, если достаточно данных для расчёта динамики (минимум 3 тренировки)|

### GET /trainings/muscle-load

Получить нагрузку по группам мышц за период.

**Query параметры:**

| Параметр | Тип      | Обязательный | Описание                                                                 |
|----------|----------|--------------|--------------------------------------------------------------------------|
| `since`  | ISO 8601 | Нет          | Нижняя граница по `plannedTo`. По умолчанию — 31 день назад.           |
| `limit`  | int      | Нет          | Максимальное количество тренировок (до 100). По умолчанию — 50.        |

**Ответ (200):**

```json
{
  "data": [
    {
      "trainingId": 123,
      "plannedTo": "2026-10-24T15:00:00.000Z",
      "muscleGroups": [
        {
          "muscleGroupId": 1,
          "muscleGroupTitle": "Грудь",
          "plannedLoad": 15.2,
          "executedLoad": 14.8,
          "agonyCnt": 2,
          "synergyCnt": 1
        }
      ]
    }
  ],
  "meta": {
    "total": 1
  }
}
```

| Поле                              | Тип     | Описание                                                        |
|-----------------------------------|---------|-----------------------------------------------------------------|
| `trainingId`                      | int     | ID тренировки                                                   |
| `plannedTo`                       | ISO 8601| Запланированная дата тренировки                                 |
| `muscleGroups`                    | array   | Нагрузка по группам мышц                                        |
| `muscleGroups[].plannedLoad`      | number  | Плановая нагрузка на группу                                     |
| `muscleGroups[].executedLoad`     | number  | Фактическая нагрузка на группу                                  |
| `muscleGroups[].agonyCnt`         | int     | Количество упражнений, где группа была агонистом                |
| `muscleGroups[].synergyCnt`       | int     | Количество упражнений, где группа была синергистом              |

### Ошибки динамики

| Статус | Тело ответа                                                | Причина                                    |
|--------|------------------------------------------------------------|--------------------------------------------|
| 401    | `{ "error": "Authorization header with Bearer token is required" }` | Отсутствует заголовок авторизации          |
| 401    | `{ "error": "Invalid or expired token" }`                  | Токен невалиден или истёк                  |
| 400    | `{ "error": "since must be a valid ISO 8601 datetime" }`   | Невалидный формат даты                     |
| 400    | `{ "error": "limit must be a positive integer up to 100" }`| `limit` вне диапазона                      |
| 500    | `{ "error": "Internal server error" }`                     | Внутренняя ошибка сервера                  |
