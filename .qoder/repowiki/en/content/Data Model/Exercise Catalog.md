# Exercise Catalog

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [20260530103546_action_require/migration.sql](file://prisma/migrations/20260530103546_action_require/migration.sql)
- [20260530132935_equipment/migration.sql](file://prisma/migrations/20260530132935_equipment/migration.sql)
- [20260602165000_action_search_gin_trgm/migration.sql](file://prisma/migrations/20260602165000_action_search_gin_trgm/migration.sql)
- [20260707120000_muscle_classification/migration.sql](file://prisma/migrations/20260707120000_muscle_classification/migration.sql)
- [20260903132404_add_duration_exercises/migration.sql](file://prisma/migrations/20260903132404_add_duration_exercises/migration.sql)
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [exercises.ts (core)](file://src/core/exercises.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)
- [actions.ts (muscles)](file://src/app/muscles/actions.ts)
- [types.ts (equipment)](file://src/app/equipment/types.ts)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)
- [TrainingExerciseAddSearch.tsx](file://src/app/trainings/components/TrainingExerciseAddSearch.tsx)
- [ActionMuscles.tsx](file://src/app/actions/components/ActionMuscles.tsx)
- [types.ts (actions)](file://src/app/actions/types.ts)
- [route.ts (images)](file://src/app/api/images/route.ts)
- [SimilarExercises.tsx](file://src/app/actions/components/SimilarExercises.tsx)
- [route.ts (exercises/similar)](file://src/app/api/exercises/similar/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the Action (exercise) model and its ecosystem within the application: muscle mappings, equipment requirements, rig types, duration-based exercises, the derived base metric, and search capabilities. It focuses on how exercises are modeled, related to muscles, constrained by equipment, and efficiently searched using a GIN trigram index.

## Project Structure
The exercise catalog spans database schema definitions, API routes for search and images, core constants for defaults, and UI components that render and filter exercises based on rig and equipment.

```mermaid
graph TB
subgraph "Database Schema"
A["Action"]
M1["ActionsOnMusclesAgony"]
M2["ActionsOnMusclesSynergy"]
M3["ActionsOnMusclesStabilizer"]
M4["ActionsOnMusclesAntagonist"]
E1["Equipment"]
E2["EquipmentRequire"]
E3["EquipmentRig"]
IMG["ExerciseImage"]
end
subgraph "API"
S["/api/actions/search"]
I["/api/images"]
SIM["/api/exercises/similar"]
end
subgraph "Core"
C["core/exercises.ts"]
AP["core/approaches.ts"]
end
subgraph "Server Actions"
MA["muscles/actions.ts"]
end
subgraph "UI"
U1["TrainingExerciseAddSearch.tsx"]
U2["ActionMuscles.tsx"]
U3["EquipmentForm.tsx"]
U4["SimilarExercises.tsx"]
end
A --- M1
A --- M2
A --- M3
A --- M4
E1 --- E2
E1 --- E3
A --- IMG
U1 --> S
U2 --> A
U3 --> E1
U4 --> SIM
S --> C
I --> IMG
MA --> C
C --> AP
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [route.ts (images)](file://src/app/api/images/route.ts)
- [route.ts (exercises/similar)](file://src/app/api/exercises/similar/route.ts)
- [exercises.ts (core)](file://src/core/exercises.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)
- [actions.ts (muscles)](file://src/app/muscles/actions.ts)
- [TrainingExerciseAddSearch.tsx](file://src/app/trainings/components/TrainingExerciseAddSearch.tsx)
- [ActionMuscles.tsx](file://src/app/actions/components/ActionMuscles.tsx)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)
- [SimilarExercises.tsx](file://src/app/actions/components/SimilarExercises.tsx)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)

## Core Components
- Action (exercise) model with fields for title, description, alias, markdown flag, and a searchable text column.
- Muscle mapping via four junction tables: Agony, Synergy, Stabilizer, Antagonist.
- Rig type enum and requirement enum to classify exercises by equipment usage.
- Equipment model per user with required types and rig-specific weight settings.
- Exercise image model for visual documentation.
- Similar exercises relationship for cross-referencing related movements.
- **Duration-based exercises**: `isDurationBased`, `durationParamLabel`, `durationParamUnit` describe movements measured in seconds instead of repetitions.
- **Base metric**: `Action.base` is derived from the `sizeFactor` of agonist and synergist muscles and is recalculated whenever a muscle is updated.

Key enums and models:
- ActionRig: BLOCKS, BARBELL, DUMBBELL, KETTLEBELL, OTHER
- ActionRequire: NONE, UPBAR, BENCH, SIMULATOR
- Equipment, EquipmentRequire, EquipmentRig
- ActionsOnMuscles* tables linking Action and Muscle
- ExerciseImage linked to Action
- SimilarExercises linking two Actions

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [20260530103546_action_require/migration.sql](file://prisma/migrations/20260530103546_action_require/migration.sql)
- [20260530132935_equipment/migration.sql](file://prisma/migrations/20260530132935_equipment/migration.sql)

## Architecture Overview
The exercise catalog is centered around the Action entity, enriched by muscle relationships, equipment constraints, and search indexing. The search API filters by term, rig types, and equipment requirements, returning actions with their muscle groups. Images are managed through a dedicated API.

```mermaid
sequenceDiagram
participant UI as "TrainingExerciseAddSearch.tsx"
participant API as "/api/actions/search"
participant DB as "PostgreSQL (Prisma)"
participant IDX as "GIN Trigram Index"
UI->>API : GET /api/actions/search?term=...&rigs=...&requires=...
API->>DB : prisma.action.findMany({ where : { search : { contains }, rig : in [...], require : in [...] } })
DB->>IDX : Use GIN trgm_ops on Action.search
IDX-->>DB : Fast substring match
DB-->>API : Actions with MusclesAgony/Synergy/Stabilizer/Antagonist
API-->>UI : JSON array of actions
```

**Diagram sources**
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [20260602165000_action_search_gin_trgm/migration.sql](file://prisma/migrations/20260602165000_action_search_gin_trgm/migration.sql)
- [schema.prisma](file://prisma/schema.prisma)

## Detailed Component Analysis

### Action Model and Muscle Mappings
- Action stores metadata and a searchable text field used for substring matching.
- Four junction tables map muscles to actions by role:
  - Agony: primary movers
  - Synergy: assisting muscles
  - Stabilizer: stabilizing muscles
  - Antagonist: opposing muscles
- Each junction includes both actionId and muscleId with composite primary keys.
- Muscles have group associations, descriptive metadata, and classification fields (`priorityRank`, `sizeFactor`).
- **Note**: The former `strengthAllowed` restriction was removed; every exercise/action now supports the STRENGTH ("На силу") purpose.
- **Updated**: Action also carries duration-based flags (`isDurationBased`, `durationParamLabel`, `durationParamUnit`) — see the dedicated section below.

```mermaid
erDiagram
ACTION {
int id PK
string title
string desc
string alias
boolean bigCount
boolean allowCheating
boolean oneDumbbell
boolean isDurationBased
string durationParamLabel
string durationParamUnit
float base
enum rig
enum require
text search
}
MUSCLE {
int id PK
string title
string titleEn
int priorityRank
float sizeFactor
int groupId
}
ACTIONS_ON_MUSCLES_AGONY {
int actionId PK
int muscleId PK
}
ACTIONS_ON_MUSCLES_SYNERGY {
int actionId PK
int muscleId PK
}
ACTIONS_ON_MUSCLES_STABILIZER {
int actionId PK
int muscleId PK
}
ACTIONS_ON_MUSCLES_ANTAGONIST {
int actionId PK
int muscleId PK
}
ACTION ||--o{ ACTIONS_ON_MUSCLES_AGONY : "has agonists"
ACTION ||--o{ ACTIONS_ON_MUSCLES_SYNERGY : "has synergists"
ACTION ||--o{ ACTIONS_ON_MUSCLES_STABILIZER : "has stabilizers"
ACTION ||--o{ ACTIONS_ON_MUSCLES_ANTAGONIST : "has antagonists"
MUSCLE ||--o{ ACTIONS_ON_MUSCLES_AGONY : "is agonist"
MUSCLE ||--o{ ACTIONS_ON_MUSCLES_SYNERGY : "is synergist"
MUSCLE ||--o{ ACTIONS_ON_MUSCLES_STABILIZER : "is stabilizer"
MUSCLE ||--o{ ACTIONS_ON_MUSCLES_ANTAGONIST : "is antagonist"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [ActionMuscles.tsx](file://src/app/actions/components/ActionMuscles.tsx)
- [types.ts (actions)](file://src/app/actions/types.ts)

### Base Metric and Duration-Based Exercises
**Updated** `Action.base` is no longer maintained by hand: it is derived from the sizes of the muscles involved.

- `calcActionBase(agonistSizeFactors, synergistSizeFactors)` = `BASE_AGONY_COEF × Σ agonists + BASE_SYNERGY_COEF × Σ synergists`, with coefficients 0.7 and 0.3.
- Stabilizers and antagonists do not contribute to the base metric.
- `recalcBaseForMuscle(muscleId)` collects every action linked to the muscle as an agonist or a synergist, loads all their agonist/synergist muscles in three batched queries, and updates `base` for all affected actions inside a single Prisma transaction.
- The recalculation is triggered from the muscle update server action (`handleMuscleUpdate` in `src/app/muscles/actions.ts`), so editing `Muscle.sizeFactor` immediately refreshes the catalog ordering used by search (`orderBy: { base: "desc" }`).

**New** Duration-based exercises model movements measured in time rather than in repetitions:

- `Action.isDurationBased` switches the exercise into duration mode.
- `Action.durationParamLabel` and `Action.durationParamUnit` label the optional difficulty parameter (for example an added load and its unit); both may be empty when the exercise has only a time component.
- Semantics: seconds are stored in the count fields (`Approach.count`, `TrainingExerciseExecution.liftedCount`), the difficulty parameter in the weight fields (`Approach.weight`, `TrainingExerciseExecution.liftedWeight`) and may legitimately be zero.
- Purpose is always normalized to LOSS: `createExercise` reads `isDurationBased` first and overrides the requested purpose before branching.
- The initial approach group for such an exercise is created by `createDurationInitial` with `ApproachesDurationDefault` — three sets of 30 seconds at zero weight.

```mermaid
flowchart TD
Start(["createExercise(trainingId, actionId, purpose)"]) --> Load["Load Action.isDurationBased"]
Load --> IsDuration{"isDurationBased?"}
IsDuration --> |Yes| Force["purpose := LOSS"]
IsDuration --> |No| Keep["keep requested purpose"]
Force --> HasLoss{"ActionLoss exists?"}
Keep --> Branch["branch by purpose<br/>(MASS / STRENGTH / LOSS)"]
HasLoss --> |No| DurationInitial["createDurationInitial<br/>3 × 30 s, weight 0"]
HasLoss --> |Yes| Reuse["reuse existing ActionLoss"]
Branch --> Create["create TrainingExercise"]
DurationInitial --> Create
Reuse --> Create
Create --> Difficulty["calculateExerciseDifficulty"]
Difficulty --> End(["Exercise ready"])
```

**Diagram sources**
- [exercises.ts (core)](file://src/core/exercises.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)

**Section sources**
- [exercises.ts (core)](file://src/core/exercises.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)
- [actions.ts (muscles)](file://src/app/muscles/actions.ts)
- [20260707120000_muscle_classification/migration.sql](file://prisma/migrations/20260707120000_muscle_classification/migration.sql)
- [20260903132404_add_duration_exercises/migration.sql](file://prisma/migrations/20260903132404_add_duration_exercises/migration.sql)

### Rig Types and Equipment Requirements
- ActionRig classifies the primary equipment category for an exercise: blocks/barbell/dumbbell/kettlebell/bodyweight.
- ActionRequire indicates minimal equipment needs: none, pull-up bars/dips, bench, or simulator.
- User-defined Equipment sets can specify which ActionRequire types are available and per-rig weight ranges (min, step, max).
- Training pages load current equipment and derive allowed rigs and requires for filtering.

```mermaid
classDiagram
class Action {
+enum rig
+enum require
}
class Equipment {
+string name
+boolean isDefault
}
class EquipmentRequire {
+enum type
}
class EquipmentRig {
+enum type
+decimal minWeight
+decimal step
+decimal maxWeight
}
Action --> EquipmentRequire : "filtered by"
Action --> EquipmentRig : "filtered by"
Equipment --> EquipmentRequire : "has many"
Equipment --> EquipmentRig : "has many"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [types.ts (equipment)](file://src/app/equipment/types.ts)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [types.ts (equipment)](file://src/app/equipment/types.ts)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)
- [TrainingExerciseAddSearch.tsx](file://src/app/trainings/components/TrainingExerciseAddSearch.tsx)

### Search Capabilities and GIN Trigram Index
- The search endpoint accepts a term and optional rigs/requires filters.
- The term is lowercased and split on whitespace; **every** word must match `Action.search`, since each word becomes a `{ search: { contains, mode: "insensitive" } }` predicate combined with `AND`. A multi-word query therefore narrows results instead of broadening them.
- PostgreSQL pg_trgm extension enables GIN trigram indexing for efficient LIKE '%...%' queries.
- Results include full muscle mappings grouped by role.

```mermaid
flowchart TD
Start(["GET /api/actions/search"]) --> ParseParams["Parse query params<br/>term, rigs, requires"]
ParseParams --> TermCheck{"Has 'term'?"}
TermCheck --> |No| ReturnEmpty["Return []"]
TermCheck --> |Yes| BuildWhere["Build where clause:<br/>search.contains(each term word, AND),<br/>rig IN rigs, require IN requires"]
BuildWhere --> QueryDB["Query Prisma with includes for all muscle roles"]
QueryDB --> SortByBase["Order by base score desc"]
SortByBase --> ReturnResults["Return JSON array of actions"]
```

**Diagram sources**
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [20260602165000_action_search_gin_trgm/migration.sql](file://prisma/migrations/20260602165000_action_search_gin_trgm/migration.sql)
- [exercises.ts (core)](file://src/core/exercises.ts)

**Section sources**
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [20260602165000_action_search_gin_trgm/migration.sql](file://prisma/migrations/20260602165000_action_search_gin_trgm/migration.sql)
- [exercises.ts (core)](file://src/core/exercises.ts)

### Exercise Images Handling
- Exercise images are stored with filename, path, size, format, and a main flag.
- Upload API validates file type and size, persists metadata, and manages the main image.
- Retrieval lists images for a given action; deletion removes metadata only.

```mermaid
sequenceDiagram
participant UI as "ActionImagesSection.tsx"
participant API as "/api/images"
participant FS as "Filesystem"
participant DB as "Prisma (ExerciseImage)"
UI->>API : POST multipart/form-data {file, actionId}
API->>FS : Save file to public/uploads
API->>DB : Create ExerciseImage record
DB-->>API : Image metadata
API-->>UI : {success, image}
UI->>API : PATCH ?id={imageId}&setMain=true/false
API->>DB : Update isMain flag (and clear previous main if setMain=true)
DB-->>API : Updated image
API-->>UI : {success, image}
UI->>API : DELETE ?id={imageId}
API->>DB : Delete ExerciseImage record
DB-->>API : OK
API-->>UI : {success}
```

**Diagram sources**
- [route.ts (images)](file://src/app/api/images/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [route.ts (images)](file://src/app/api/images/route.ts)
- [schema.prisma](file://prisma/schema.prisma)

### Similar Exercises Relationship
- SimilarExercises links two Actions bidirectionally (SimilarTo/SimilarFrom).
- The similar endpoint returns related actions filtered by the same rig and require constraints.
- UI renders similar exercises as links to their cards.

```mermaid
classDiagram
class Action {
+int id
+string title
+enum rig
+enum require
}
class SimilarExercises {
+int actionId
+int similarActionId
}
Action ||--o{ SimilarExercises : "SimilarFrom"
Action ||--o{ SimilarExercises : "SimilarTo"
```

**Diagram sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts (exercises/similar)](file://src/app/api/exercises/similar/route.ts)
- [SimilarExercises.tsx](file://src/app/actions/components/SimilarExercises.tsx)

**Section sources**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts (exercises/similar)](file://src/app/api/exercises/similar/route.ts)
- [SimilarExercises.tsx](file://src/app/actions/components/SimilarExercises.tsx)

## Dependency Analysis
- Search depends on core default enums for rigs and requires to build default filters when not provided.
- UI components pass selected rigs and requires from user’s equipment configuration into search requests.
- Muscle display components rely on included relations from the search query.
- Image APIs depend on filesystem operations and Prisma records.
- `Muscle.sizeFactor` feeds `Action.base`; the muscle update server action depends on `recalcBaseForMuscle` from `core/exercises.ts`.
- `createExercise` depends on `core/approaches.ts` for the initial approach groups, including the duration-specific one.

```mermaid
graph LR
UI_Search["TrainingExerciseAddSearch.tsx"] --> API_Search["/api/actions/search"]
API_Search --> Core_Defaults["core/exercises.ts"]
API_Search --> DB["Prisma (Action + Muscles)"]
UI_Equip["EquipmentForm.tsx"] --> DB_Equip["Equipment + Requires + Rigs"]
UI_Images["ActionImagesSection.tsx"] --> API_Images["/api/images"]
API_Images --> FS["public/uploads"]
API_Images --> DB_Img["ExerciseImage"]
MuscleAction["muscles/actions.ts"] --> Core_Defaults
Core_Defaults --> Approaches["core/approaches.ts"]
Core_Defaults --> DB
```

**Diagram sources**
- [TrainingExerciseAddSearch.tsx](file://src/app/trainings/components/TrainingExerciseAddSearch.tsx)
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [exercises.ts (core)](file://src/core/exercises.ts)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)
- [route.ts (images)](file://src/app/api/images/route.ts)
- [actions.ts (muscles)](file://src/app/muscles/actions.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)
- [schema.prisma](file://prisma/schema.prisma)

**Section sources**
- [TrainingExerciseAddSearch.tsx](file://src/app/trainings/components/TrainingExerciseAddSearch.tsx)
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [exercises.ts (core)](file://src/core/exercises.ts)
- [EquipmentForm.tsx](file://src/app/equipment/components/EquipmentForm.tsx)
- [route.ts (images)](file://src/app/api/images/route.ts)
- [actions.ts (muscles)](file://src/app/muscles/actions.ts)
- [approaches.ts (core)](file://src/core/approaches.ts)
- [schema.prisma](file://prisma/schema.prisma)

## Performance Considerations
- GIN trigram index on Action.search accelerates substring searches significantly.
- Ordering by base score prioritizes foundational exercises; base is precomputed and stored, so no aggregation happens at query time.
- Include-only queries fetch necessary muscle data without over-fetching unrelated entities.
- File uploads validate formats and sizes to prevent abuse and ensure storage efficiency.
- `recalcBaseForMuscle` uses three batched reads (agonist links, synergist links, muscle size factors) plus one transaction of per-action updates instead of N+1 queries; it only runs on muscle edits.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Search returns empty results:
  - Ensure the term is present and trimmed.
  - Verify rigs and requires parameters align with available values.
  - Confirm the GIN trigram index exists and pg_trgm extension is enabled.
- Muscle mappings missing:
  - Check that the query includes all muscle relation tables.
  - Validate junction table entries exist for the action.
- Equipment filters not applied:
  - Confirm user’s Equipment records include the desired requires and rigs.
  - Ensure UI passes correct comma-separated lists to the search endpoint.
- Image upload failures:
  - Validate file type and size limits.
  - Check filesystem permissions and upload directory existence.
- Unexpected catalog ordering:
  - `base` depends only on agonist and synergist `sizeFactor` values; verify the muscle classification data and re-save the muscle to trigger `recalcBaseForMuscle`.
- Duration-based exercise created with the wrong purpose or approach group:
  - Confirm `Action.isDurationBased` is set; the purpose is forced to LOSS and the initial group must be three 30-second sets with zero weight.
  - If the exercise already had an `ActionLoss` group from before the switch, it is reused as-is — recreate the group to get duration defaults.

**Section sources**
- [route.ts (actions/search)](file://src/app/api/actions/search/route.ts)
- [20260602165000_action_search_gin_trgm/migration.sql](file://prisma/migrations/20260602165000_action_search_gin_trgm/migration.sql)
- [route.ts (images)](file://src/app/api/images/route.ts)

## Conclusion
The exercise catalog centers on a robust Action model enriched by detailed muscle mappings, flexible equipment constraints, and high-performance search. The base metric that drives catalog ordering is derived from muscle sizes and kept in sync automatically when muscles change, and duration-based exercises extend the catalog to time-measured movements with their own parameter labels, defaults, and purpose handling. Users can tailor equipment profiles, filter exercises by rig and requirements, and leverage fast substring search backed by a GIN trigram index. Visual documentation is supported via exercise images, and related exercises are discoverable through explicit similarity relationships.

[No sources needed since this section summarizes without analyzing specific files]