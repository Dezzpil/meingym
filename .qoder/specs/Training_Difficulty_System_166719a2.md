# Training Difficulty Management System

## Task 1: Schema Migration — Add `isBoost` to Approach

**File**: `prisma/schema.prisma` (line 371-381)

Add `isBoost Boolean @default(false)` to the Approach model, after the `count` field:

```prisma
model Approach {
  id       Int   @id @default(autoincrement())
  priority Int   @default(0)
  weight   Float
  count    Int
  isBoost  Boolean @default(false)  // NEW

  groupId                   Int
  Group                     ApproachesGroup             @relation(fields: [groupId], references: [id], onDelete: Cascade)
  TrainingExerciseExecution TrainingExerciseExecution[]
}
```

Run migration: `npx prisma migrate dev --name add_approach_is_boost`

**Conventions to follow**: Existing boolean flag pattern (e.g., `isPassed`, `useBelt`, `noWarmUp`) — simple boolean with `@default(false)`.

---

## Task 2: Create `previewScore()` function

**File**: `src/core/scores.ts` (append after existing `createScore` function)

Add a new pure function that calculates a pre-execution score using `ApproachesGroup` aggregates (sum, mean, max, countTotal, countMean) — the same fields that post-execution scoring uses from `TrainingExercise` (liftedSum, liftedMean, etc.).

```typescript
import type { ApproachesGroup, Purpose } from "@prisma/client";

/**
 * Предварительная оценка выполнения упражнения (до выполнения).
 * Использует агрегаты из ApproachesGroup вместо фактических данных выполнения.
 */
export const previewScore = (
  purpose: Purpose,
  approachGroup: ApproachesGroup,
): number => {
  const normalized: ActionHistoryDataNormalized = {
    liftedSumNorm: normLogFn(approachGroup.sum),
    liftedMeanNorm: normLogFn(approachGroup.mean),
    liftedMaxNorm: normLogFn(approachGroup.max),
    liftedCountTotalNorm: normLogFn(approachGroup.countTotal),
    liftedCountMeanNorm: normLogFn(approachGroup.countMean),
  };
  const { score } = scoreNormalized(purpose, normalized);
  return score;
};
```

**Key insight**: Reuses existing `normLogFn()`, `scoreNormalized()`, and `ScoreCoefficients` — no coefficient duplication. The difference from post-execution scoring is only the data source (ApproachesGroup planned data vs TrainingExercise actual data).

---

## Task 3: Create difficulty calculation module

**File**: `src/core/difficulty.ts` (NEW)

This module provides:
1. `calculateExerciseDifficulty()` — single exercise difficulty: `action.base * previewScore(purpose, approachGroup)`
2. `calculateTrainingDifficulty()` — sum of all exercise difficulties in a training

```typescript
import type { Action, ApproachesGroup, Purpose } from "@prisma/client";
import { previewScore } from "@/core/scores";

export type ExerciseDifficultyInput = {
  action: Pick<Action, "base">;
  approachGroup: ApproachesGroup;
  purpose: Purpose;
};

/**
 * Сложность выполнения упражнения = Базовость движения × предварительная оценка
 */
export function calculateExerciseDifficulty(input: ExerciseDifficultyInput): number {
  return input.action.base * previewScore(input.purpose, input.approachGroup);
}

/**
 * Сложность тренировки = сумма сложностей всех упражнений
 */
export function calculateTrainingDifficulty(exercises: ExerciseDifficultyInput[]): number {
  return exercises.reduce((sum, ex) => sum + calculateExerciseDifficulty(ex), 0);
}
```

**Dependencies**: Task 2 (previewScore must exist).

---

## Task 4: Create boost strategy interface and implementation

**File**: `src/core/difficulty/boostStrategy.ts` (NEW)

```typescript
import type { Approach, ApproachesGroup } from "@prisma/client";

export type TrainingExerciseWithApproaches = {
  id: number;
  approachGroup: ApproachesGroup & { Approaches: Approach[] };
};

export interface TrainingDifficultyBoostStrategy {
  apply(exercises: TrainingExerciseWithApproaches[]): Promise<void>;
  revert(exercises: TrainingExerciseWithApproaches[]): Promise<void>;
}
```

**File**: `src/core/difficulty/extraApproachesBoost.ts` (NEW)

Implementation of Idea 2: adds extra approaches marked `isBoost=true` to exercises.

Key logic:
- `apply()`: For each exercise, duplicate the last approach (or use a template) and create new Approach records with `isBoost: true`. Recalculate ApproachesGroup stats and time estimate.
- `revert()`: Delete all approaches where `isBoost: true` for the given exercises. Recalculate stats and time.
- Guard: Check `training.startedAt === null` before both operations.

The strategy must call `handleUpdateApproachGroup()` pattern (recalculate stats + time) after modifying approaches.

**Dependencies**: Task 1 (isBoost field must exist).

---

## Task 5: Filter boost approaches in progression calculation

**File**: `src/app/trainings/[id]/execute/actions.ts` (lines 368-391)

In `handleProcessCompletedTraining()`, add filtering to exclude `isBoost` approaches from both planned and executed sets:

```typescript
// Line 369: Filter boost approaches from planned sets
for (const approach of exercise.ApproachGroup.Approaches) {
  if (approach.isBoost) continue; // Skip boost approaches
  plannedSetsData.push({
    count: approach.count,
    weight: approach.weight,
    priority: approach.priority,
  });
}

// Lines 378-391: Filter boost approaches from executed sets
const executedSetsData: ApproachExecutedData[] =
  exercise.TrainingExerciseExecution.filter(
    (e) => !e.isPassed && e.liftedCount > 0 && !isBoostExecution(e, exercise.ApproachGroup.Approaches),
  ).map((e) => { ... });
```

Helper to resolve boost status from execution's `approachId`:
```typescript
function isBoostExecution(
  execution: TrainingExerciseExecution,
  approaches: Approach[]
): boolean {
  if (!execution.approachId) return false;
  const approach = approaches.find(a => a.id === execution.approachId);
  return approach?.isBoost ?? false;
}
```

**Note**: The query at line 300-318 already includes `ApproachGroup: { include: { Approaches: ... } }`, so `approach.isBoost` is available without query changes.

**Dependencies**: Task 1 (isBoost in schema), Task 2 (migration applied).

---

## Task 6: Create server action for boost toggle

**File**: `src/app/trainings/[id]/difficulty/actions.ts` (NEW)

Two server actions:
1. `handleApplyDifficultyBoost(trainingId: number)` — applies boost to training exercises
2. `handleRevertDifficultyBoost(trainingId: number)` — removes all boost approaches

Logic:
- Fetch training with exercises and approaches
- Guard: `if (training.startedAt) throw new Error("Cannot modify boost after training started")`
- On apply: Use `ExtraApproachesBoostStrategy.apply()`
- On revert: Use `ExtraApproachesBoostStrategy.revert()`
- After both: Trigger time estimate recalculation via `TrainingTimeAvgScorer().score(trainingId)`
- Call `revalidatePath()` for the training page

**Dependencies**: Task 4 (strategy implementation), Task 1.

---

## Task 7: Update `handleUpdateApproachGroup` to handle `isBoost` field

**File**: `src/app/approaches/actions.ts` (line 26-28)

When `ApproachData` is passed to `handleUpdateApproachGroup`, it must support the optional `isBoost` field:

```typescript
// In src/core/approaches.ts — update ApproachData type:
export type ApproachData = {
  count: number;
  weight: number;
  priority: number;
  isBoost?: boolean; // NEW
};
```

The `createMany` call at line 28 will naturally persist `isBoost` if present in data (Prisma handles this). When computing stats in `calculateStats()`, consider whether to exclude boost approaches from group aggregates (recommendation: include them, since the group represents the full planned workout including boost).

**Dependencies**: Task 1.

---

## Task 8: UI toggle component for training difficulty boost

**File**: `src/app/trainings/[id]/page.tsx` or relevant training detail component

Add a toggle button that:
- Calls `handleApplyDifficultyBoost(trainingId)` or `handleRevertDifficultyBoost(trainingId)`
- Is disabled when `training.startedAt` is set
- Shows current boost state (e.g., whether any approaches have `isBoost: true`)
- Displays training difficulty value (from `calculateTrainingDifficulty`)

**Dependencies**: Tasks 3, 6.

---

## Task 9: Unit tests

**File**: `src/tests/core/difficulty.test.ts` (NEW)

Test coverage:
1. `previewScore()` — produces correct score for each purpose (STRENGTH, MASS, LOSS)
2. `calculateExerciseDifficulty()` — multiplies base by previewScore correctly
3. `calculateTrainingDifficulty()` — sums correctly, handles empty arrays
4. Boost filtering — `isBoost: true` approaches are excluded from `plannedSetsData` and `executedSetsData`
5. Strategy apply/revert — approaches created with `isBoost: true` / deleted on revert

**Dependencies**: Tasks 2, 3, 4, 5.

---

## Dependency Graph

```
Task 1 (Schema: isBoost)
├── Task 2 (previewScore function)
│   └── Task 3 (difficulty module)
│       └── Task 8 (UI toggle)
├── Task 4 (boost strategy)
│   └── Task 6 (server actions for toggle)
│       └── Task 8 (UI toggle)
├── Task 5 (progression filtering)
├── Task 7 (ApproachData type update)
└── Task 9 (tests — after all)
```

**Parallelizable**: Tasks 2+4+5+7 can all proceed in parallel after Task 1 completes.

---

## Conventions & Patterns to Follow

- **Boolean flags**: Use `@default(false)` pattern (matches `isPassed`, `useBelt`, `noWarmUp`)
- **Server actions**: Use `"use server"` directive, `getCurrentUserId()` for auth, `revalidatePath()` for cache invalidation
- **Pure functions**: Scoring/difficulty calculations are pure (no DB calls inside), data fetched externally and passed in
- **Time recalculation**: Always call `TrainingTimeAvgScorer().score(trainingId)` after approach modifications (existing pattern at `src/app/approaches/actions.ts:42`)
- **Error messages**: Use Russian strings for user-facing errors (existing pattern)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Boost approaches included in progression by mistake | `if (approach.isBoost) continue` at line 369; unit test to verify |
| User toggles boost after training started | Guard: check `training.startedAt` before apply/revert |
| ApproachesGroup stats include boost data, skewing previewScore | Acceptable: previewScore should reflect actual planned load including boost; difficulty SHOULD be higher with boost |
| N+1 in avgScorer.ts (existing bug, lines 21-26) | Not blocking, but recommend batch-loading fix in follow-up |
| previewScore diverges from postScore formula | Both use identical `normLogFn` + `ScoreCoefficients`; only data source differs |

---

## Rejected Alternatives

1. **Placing previewScore in a separate file** (Plan A's `src/core/difficulty.ts` for everything): Rejected because `previewScore` reuses `normLogFn`, `scoreNormalized`, `ScoreCoefficients` — co-locating it in `scores.ts` avoids circular imports and makes the symmetry with post-execution scoring obvious. The higher-level `calculateExerciseDifficulty` and `calculateTrainingDifficulty` go in a separate `difficulty.ts` module.

2. **Adding `difficultyScore` cache field to Training model** (Plan B): Premature optimization. Training difficulty changes whenever approaches change. On-demand calculation is fast enough (pure math over already-loaded data). Can add caching later if needed.

3. **Adding composite DB indexes** (Plan B): The current query patterns don't warrant new indexes for this feature. ApproachesGroup is always accessed via FK from TrainingExercise, not searched independently.

4. **Using an enum instead of boolean for boost** (considered): A boolean `isBoost` is simpler, matches existing patterns, and is sufficient for Idea 2. If Idea 1 (adding exercises) is implemented later, it would use a different mechanism entirely (adding TrainingExercise records, not flagging approaches).

5. **Filtering at DB query level** (WHERE isBoost = false): Rejected because `handleProcessCompletedTraining` already loads all approaches eagerly. In-memory filtering is simpler and avoids changing the include structure that other code depends on.