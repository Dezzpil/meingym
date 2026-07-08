-- Migration: muscle_classification
-- Adds titleEn, priorityRank, sizeFactor to Muscle and backfills data from muscle_classification.json

-- Step 1: Add new columns
ALTER TABLE "Muscle" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "Muscle" ADD COLUMN "priorityRank" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Muscle" ADD COLUMN "sizeFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- Step 2: Rename "Зубчатая" → "Передняя зубчатая" (matches JSON's ru title for Serratus Anterior)
UPDATE "Muscle" SET title = 'Передняя зубчатая' WHERE title = 'Зубчатая';

-- Step 3: Create "Шея" muscle group if not exists
INSERT INTO "MuscleGroup" ("title")
SELECT 'Шея'
WHERE NOT EXISTS (SELECT 1 FROM "MuscleGroup" WHERE title = 'Шея');

-- Step 4: Load classification data into a temp table (all 55 muscles from muscle_classification.json)
CREATE TEMP TABLE _muscle_classification (
  title_ru       TEXT,
  title_en       TEXT,
  group_title    TEXT,
  priority_rank  INT,
  size_factor    DOUBLE PRECISION
);

INSERT INTO _muscle_classification (title_ru, title_en, group_title, priority_rank, size_factor) VALUES
-- Плечи
('Передняя дельта',              'Anterior Deltoid',                                                       'Плечи', 2, 0.5),
('Средняя дельта',               'Lateral Deltoid',                                                         'Плечи', 3, 0.5),
('Задняя дельта',                'Posterior Deltoid',                                                       'Плечи', 2, 0.5),
('Клювовидно-плечевая',          'Coracobrachialis',                                                        'Плечи', 1, 0.3),
('Надостная',                    'Supraspinatus',                                                           'Плечи', 1, 0.3),
('Подостная',                    'Infraspinatus',                                                           'Плечи', 1, 0.4),
('Подлопаточная',                'Subscapularis',                                                           'Плечи', 1, 0.4),
-- Руки
('Бицепс',                       'Biceps Brachii',                                                          'Руки',  3, 0.5),
('Трицепс',                      'Triceps Brachii',                                                         'Руки',  3, 0.7),
('Плече-лучевая',                'Brachioradialis',                                                         'Руки',  2, 0.4),
('Плечевая (брахиалис)',         'Brachialis',                                                              'Руки',  2, 0.4),
('Локтевая',                     'Anconeus',                                                                'Руки',  1, 0.3),
('Лучевая (лучевой сгибатель)',  'Flexor Carpi Radialis',                                                   'Руки',  1, 0.3),
('Сгибатели пальцев',            'Finger Flexors (Flexor Digitorum Superficialis / Profundus)',             'Руки',  1, 0.3),
('Разгибатели запястья',         'Wrist Extensors (Extensor Carpi Radialis / Ulnaris)',                     'Руки',  1, 0.3),
('Пронатор круглый',             'Pronator Teres',                                                          'Руки',  1, 0.3),
('Супинатор',                    'Supinator',                                                               'Руки',  1, 0.3),
-- Кора
('Кора',                         'Core',                                                                    'Кора',  2, 0.7),
-- Грудь
('Большая грудная',              'Pectoralis Major',                                                        'Грудь', 3, 1.0),
('Малая грудная',                'Pectoralis Minor',                                                        'Грудь', 1, 0.4),
('Передняя зубчатая',            'Serratus Anterior',                                                       'Грудь', 1, 0.4),
('Подключечная',                 'Subclavius',                                                              'Грудь', 1, 0.3),
-- Спина
('Трапецивидная (верх)',         'Trapezius (Upper)',                                                       'Спина', 2, 0.7),
('Трапецивидная (низ)',          'Trapezius (Lower)',                                                       'Спина', 2, 0.5),
('Большая круглая',              'Teres Major',                                                             'Спина', 1, 0.4),
('Широчайшая',                   'Latissimus Dorsi',                                                        'Спина', 3, 1.0),
('Малая круглая',                'Teres Minor',                                                             'Спина', 1, 0.3),
('Ромбовидная',                  'Rhomboids',                                                               'Спина', 2, 0.5),
('Мышца, поднимающая лопатку',   'Levator Scapulae',                                                        'Спина', 1, 0.3),
-- Живот
('Наружная косая',               'External Oblique',                                                        'Живот', 2, 0.5),
('Прямая',                       'Rectus Abdominis',                                                        'Живот', 3, 0.7),
('Внутренняя косая',             'Internal Oblique',                                                        'Живот', 2, 0.4),
('Поперечная',                   'Transverse Abdominis',                                                    'Живот', 1, 0.4),
-- Поясница
('Разгибатели спины',            'Erector Spinae',                                                          'Поясница', 3, 0.7),
('Подвздошно-поясничные',        'Iliopsoas',                                                               'Поясница', 2, 0.5),
('Квадратная',                   'Quadratus Lumborum',                                                      'Поясница', 1, 0.4),
-- Ноги
('Большая ягодичная',            'Gluteus Maximus',                                                         'Ноги',  3, 1.0),
('Четырехглавая (квадрицепс)',   'Quadriceps Femoris',                                                      'Ноги',  3, 1.0),
('Двуглавая (бицепс)',           'Biceps Femoris',                                                          'Ноги',  3, 0.7),
('Полусухожильная',              'Semitendinosus',                                                          'Ноги',  2, 0.5),
('Полуперепончатая',             'Semimembranosus',                                                         'Ноги',  2, 0.5),
('Средняя и малая ягодичная',    'Gluteus Medius and Minimus',                                              'Ноги',  2, 0.5),
('Приводящая бедро',             'Hip Adductors',                                                           'Ноги',  2, 0.7),
('Икроножная',                   'Gastrocnemius',                                                           'Ноги',  2, 0.5),
('Камбаловидная',                'Soleus',                                                                  'Ноги',  1, 0.4),
('Портняжная',                   'Sartorius',                                                               'Ноги',  1, 0.3),
('Напрягатель широкой фасции',   'Tensor Fasciae Latae',                                                    'Ноги',  1, 0.3),
('Гребенчатая',                  'Pectineus',                                                               'Ноги',  1, 0.3),
('Задняя большеберцовая',        'Tibialis Posterior',                                                      'Ноги',  1, 0.3),
('Передняя большеберцовая',      'Tibialis Anterior',                                                       'Ноги',  1, 0.4),
('Сгибатели пальцев стопы',      'Toe Flexors (Flexor Digitorum Longus / Brevis)',                          'Ноги',  1, 0.3),
-- Шея
('Грудино-ключично-сосцевидная', 'Sternocleidomastoid',                                                     'Шея',   1, 0.4),
('Ременная',                     'Splenius (Capitis / Cervicis)',                                           'Шея',   1, 0.4),
('Глубокие сгибатели',           'Deep Neck Flexors (Longus Colli / Longus Capitis)',                       'Шея',   1, 0.3),
('Лестничные',                   'Scalenes (Anterior / Middle / Posterior)',                                'Шея',   1, 0.3);

-- Step 5: Update existing muscles by matching Russian title
UPDATE "Muscle" m SET
  "titleEn"      = c.title_en,
  "priorityRank" = c.priority_rank,
  "sizeFactor"   = c.size_factor,
  "groupId"      = mg.id
FROM _muscle_classification c
JOIN "MuscleGroup" mg ON mg.title = c.group_title
WHERE m.title = c.title_ru;

-- Step 6: Insert new muscles that don't exist yet
INSERT INTO "Muscle" ("title", "titleEn", "groupId", "priorityRank", "sizeFactor")
SELECT c.title_ru, c.title_en, mg.id, c.priority_rank, c.size_factor
FROM _muscle_classification c
JOIN "MuscleGroup" mg ON mg.title = c.group_title
WHERE NOT EXISTS (SELECT 1 FROM "Muscle" m WHERE m.title = c.title_ru);

-- Step 7: Clean up
DROP TABLE _muscle_classification;
