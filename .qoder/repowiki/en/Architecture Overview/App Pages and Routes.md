# App Pages and Routes

<cite>
**Referenced Files**
- [src/app/layout.tsx](file://src/app/layout.tsx)
- [src/app/actions/](file://src/app/actions/)
- [src/app/trainings/](file://src/app/trainings/)
- [src/app/api/](file://src/app/api/)
- [src/app/equipment/](file://src/app/equipment/)
- [src/app/muscles/](file://src/app/muscles/)
- [src/app/profile/](file://src/app/profile/)
</cite>

## Introduction

The `src/app/` directory implements all page routes using the Next.js App Router. Each feature area is a self-contained directory with co-located server actions, components, and types. This document maps every route and API endpoint.

## Page Routes

```mermaid
graph TB
    Root[/] --> Actions[/actions]
    Root --> Trainings[/trainings]
    Root --> Equipment[/equipment]
    Root --> MusclesGroups[/musclesgroups]
    Root --> Muscles[/muscles]
    Root --> Profile[/profile]
    Actions --> ActionsId[/actions/:id]
    Actions --> ActionsCreate[/actions/create]
    ActionsId --> ActionsCard[/card]
    ActionsId --> ActionsDetails[/details]
    ActionsId --> ActionsState[/state]
    ActionsId --> ActionsHistory[/history]
    Trainings --> TrainingsId[/trainings/:id]
    Trainings --> TrainingsCreate[/trainings/create]
    Trainings --> TrainingsPeriods[/trainings/periods]
    TrainingsId --> TrainingsExecute[/execute]
    TrainingsId --> TrainingsExercises[/exercises]
    Equipment --> EquipmentId[/equipment/:id]
    Equipment --> EquipmentCreate[/equipment/create]
    Muscles --> MusclesId[/muscles/:id]
    Muscles --> MusclesCreate[/muscles/create]
    MusclesGroups --> MGId[/musclesgroups/:id]
    MusclesGroups --> MGCreate[/musclesgroups/create]
```

**Sources**: [src/app/layout.tsx:1-33](file://src/app/layout.tsx#L1-L33)

### Feature Routes

| Route | Directory | Purpose |
|-------|-----------|---------|
| `/` | `src/app/page.tsx` | Landing page |
| `/actions` | `src/app/actions/` | Exercise catalog: list all, filter, search |
| `/actions/create` | `src/app/actions/create/` | Create new exercise |
| `/actions/[id]` | `src/app/actions/[id]/` | Exercise detail (tabs: card, details, state, history) |
| `/actions/[id]/card` | `src/app/actions/[id]/card/` | Exercise info card view |
| `/actions/[id]/details` | `src/app/actions/[id]/details/` | Detailed exercise info |
| `/actions/[id]/state` | `src/app/actions/[id]/state/` | Purpose-specific state (mass/strength/loss) |
| `/actions/[id]/history` | `src/app/actions/[id]/history/` | Score history charts and tables |
| `/trainings` | `src/app/trainings/` | Training list, creation form |
| `/trainings/create` | `src/app/trainings/create/` | Create new training |
| `/trainings/periods` | `src/app/trainings/periods/` | Period management |
| `/trainings/[id]` | `src/app/trainings/[id]/` | Training detail view |
| `/trainings/[id]/execute` | `src/app/trainings/[id]/execute/` | Live execution: record sets, warm-up |
| `/trainings/[id]/exercises` | `src/app/trainings/exercises/` | Exercise management within training |
| `/equipment` | `src/app/equipment/` | Equipment list |
| `/equipment/create` | `src/app/equipment/create/` | Create equipment set |
| `/equipment/[id]` | `src/app/equipment/[id]/` | Equipment detail/edit |
| `/muscles` | `src/app/muscles/` | Muscle catalog |
| `/muscles/create` | `src/app/muscles/create/` | Create muscle |
| `/muscles/[id]` | `src/app/muscles/[id]/` | Muscle detail with images and descriptions |
| `/musclesgroups` | `src/app/musclesgroups/` | Muscle group list |
| `/musclesgroups/create` | `src/app/musclesgroups/create/` | Create muscle group |
| `/musclesgroups/[id]` | `src/app/musclesgroups/[id]/` | Muscle group detail |
| `/profile` | `src/app/profile/` | User profile, weight chart, settings |
| `/weights` | `src/app/weights/` | Body weight history |
| `/progression` | `src/app/progression/` | Progression strategy configuration |
| `/approaches` | `src/app/approaches/` | Approach group management |
| `/admin/jobs` | `src/app/admin/jobs/` | Admin job monitoring panel |

## Server Actions Pattern

Each feature directory co-locates an `actions.ts` file with the `'use server'` directive. These functions:

1. Run exclusively on the server
2. Have direct access to Prisma and core logic
3. Handle form submissions and mutations
4. Return data or redirect after processing

**Convention**: Files are named `actions.ts` and placed at the route level (e.g., `src/app/trainings/actions.ts`, `src/app/equipment/actions.ts`).

**Sources**: [src/app/actions/actions.ts](file://src/app/actions/actions.ts) · [src/app/trainings/actions.ts](file://src/app/trainings/actions.ts)

## API Routes

While Server Actions handle most mutations, several REST API endpoints exist for specific client-side interactions:

| Endpoint | Method | Directory | Purpose |
|----------|--------|-----------|---------|
| `/api/auth/[...nextauth]` | GET/POST | `src/app/api/auth/` | NextAuth.js authentication handler |
| `/api/actions/search` | GET | `src/app/api/actions/search/` | Exercise search using GIN trigram index |
| `/api/actions/scores` | GET | `src/app/api/actions/scores/` | Exercise score history data |
| `/api/trainings/exercise/execution/complete` | POST | `src/app/api/trainings/` | Mark a set execution as complete |
| `/api/trainings/exercise/execution/uncomplete` | POST | `src/app/api/trainings/` | Revert a completed execution |
| `/api/images` | POST | `src/app/api/images/` | Upload exercise images (multipart) |
| `/api/muscle-images` | POST | `src/app/api/muscle-images/` | Upload muscle anatomy images |
| `/api/exercises/similar` | GET | `src/app/api/exercises/` | Find similar exercises |
| `/api/jobs` | GET | `src/app/api/jobs/` | Background job status (admin) |

**Sources**: [src/app/api/auth/.../route.ts:1-7](file://src/app/api/auth/%5B...nextauth%5D/route.ts#L1-L7) · [src/app/api/images/route.ts](file://src/app/api/images/route.ts)

## Feature Directory Structure

Each feature follows a consistent layout:

```
src/app/<feature>/
├── page.tsx          # Route page component (RSC by default)
├── actions.ts        # Server Actions ('use server')
├── types.ts          # Feature-specific TypeScript types
├── components/       # Client components ('use client')
│   ├── *Form.tsx     # Form components
│   ├── *Card.tsx     # Display cards
│   └── *List*.tsx    # List/item components
├── [id]/             # Dynamic route (detail view)
│   ├── page.tsx
│   ├── actions.ts
│   └── components/
└── create/           # Creation route
    └── page.tsx
```

## Conclusion

The App Router structure keeps each feature self-contained with co-located server actions, reducing cross-cutting dependencies. The `'use server'` / `'use client'` boundary is enforced per-file, with Server Components as the default for better performance.
