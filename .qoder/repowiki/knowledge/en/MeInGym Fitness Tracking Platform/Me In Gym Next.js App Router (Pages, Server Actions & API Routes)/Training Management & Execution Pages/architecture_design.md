Organized as Next.js App Router segments under `src/app/trainings/`:
- `page.tsx` — server-side training list with Prisma queries filtered by month/group/search, building muscle-group and purpose counters.
- `[id]/page.tsx` — single-training view that loads exercises, previous stats, equipment, warm-up, and renders UI components; delegates mutations to sibling `actions.ts`.
- `[id]/execute/page.tsx` — live execution flow: pre-creates `TrainingExerciseExecution` rows per approach, then renders execute cards and completion panel.
- `create/actions.ts`, `[id]/actions.ts`, `[id]/difficulty/actions.ts`, `exercises/actions.ts`, `periods/actions.ts` — all Server Actions (`"use server"`) that call core business logic from `@/core/*` (periods, exercises, difficulty, trainingMuscles, trainingTime) and revalidate paths.
- `components/` holds reusable presentational pieces (forms, charts, buttons, search modals).
- `types.ts` centralizes Zod schemas for form validation shared across client and server code.
Dependency direction is strictly one-way: pages → Server Actions → `@/core/*` → Prisma Client; no reverse imports.