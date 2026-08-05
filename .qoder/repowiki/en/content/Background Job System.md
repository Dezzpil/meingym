# Background Job System

<cite>
**Referenced Files in This Document**
- [src/jobs/index.ts](file://src/jobs/index.ts)
- [src/jobs/queues.ts](file://src/jobs/queues.ts)
- [src/jobs/config.ts](file://src/jobs/config.ts)
- [src/jobs/processors/scores.ts](file://src/jobs/processors/scores.ts)
- [src/jobs/processors/periods.ts](file://src/jobs/processors/periods.ts)
- [src/jobs/processors/images.ts](file://src/jobs/processors/images.ts)
- [src/app/api/jobs/route.ts](file://src/app/api/jobs/route.ts)
- [src/app/admin/jobs/page.tsx](file://src/app/admin/jobs/page.tsx)
- [src/app/trainings/[id]/execute/actions.ts](file://src/app/trainings/[id]/execute/actions.ts)
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
This document explains the Bull queue architecture used for asynchronous processing in the application. It focuses on three queues:
- Scores: calculates scores after training exercises are completed.
- Periods: checks and ends inactive training periods on a daily schedule.
- Images: cleans up orphaned image files on a daily schedule.

The system uses Redis as the message broker, Bull for queue management, and Prisma for database access. Jobs are scheduled from server actions and API routes, processed by background workers, and monitored via an admin dashboard and API endpoint.

## Project Structure
The background job system is implemented under src/jobs with clear separation of concerns:
- Configuration (Redis, queue names, job names, default options)
- Queue definitions and processor bindings
- Processors for each job type
- Entry point that initializes processors and schedules recurring jobs
- API and UI for monitoring

```mermaid
graph TB
subgraph "Jobs"
A["config.ts"]
B["queues.ts"]
C["index.ts"]
D["processors/scores.ts"]
E["processors/periods.ts"]
F["processors/images.ts"]
end
subgraph "App"
G["api/jobs/route.ts"]
H["admin/jobs/page.tsx"]
I["trainings/[id]/execute/actions.ts"]
end
A --> B
B --> D
B --> E
B --> F
C --> B
C --> D
C --> E
C --> F
I --> C
G --> B
H --> G
```

**Diagram sources**
- [src/jobs/config.ts:1-38](file://src/jobs/config.ts#L1-L38)
- [src/jobs/queues.ts:1-21](file://src/jobs/queues.ts#L1-L21)
- [src/jobs/index.ts:1-62](file://src/jobs/index.ts#L1-L62)
- [src/jobs/processors/scores.ts:1-37](file://src/jobs/processors/scores.ts#L1-L37)
- [src/jobs/processors/periods.ts:1-66](file://src/jobs/processors/periods.ts#L1-L66)
- [src/jobs/processors/images.ts:1-71](file://src/jobs/processors/images.ts#L1-L71)
- [src/app/api/jobs/route.ts:1-51](file://src/app/api/jobs/route.ts#L1-L51)
- [src/app/admin/jobs/page.tsx:1-204](file://src/app/admin/jobs/page.tsx#L1-L204)
- [src/app/trainings/[id]/execute/actions.ts](file://src/app/trainings/[id]/execute/actions.ts#L440-L460)

**Section sources**
- [src/jobs/config.ts:1-38](file://src/jobs/config.ts#L1-L38)
- [src/jobs/queues.ts:1-21](file://src/jobs/queues.ts#L1-L21)
- [src/jobs/index.ts:1-62](file://src/jobs/index.ts#L1-L62)

## Core Components
- Configuration: Centralizes Redis connection settings, queue names, job names, and default job options including retry attempts and exponential backoff.
- Queues: Defines three Bull queues (scores, periods, images), binds each job name to its processor, and connects to Redis using the shared configuration.
- Index: Initializes processors, exports queues, provides helper functions to schedule jobs, and sets up recurring jobs for period checks and image cleanup.
- Processors: Implement business logic for each job type, interact with Prisma, and handle errors and cleanup.

Key behaviors:
- Default job options include 3 attempts with exponential backoff and removal upon completion.
- Recurring jobs use cron expressions: midnight for period checks and 3 AM for image cleanup.
- Score calculation jobs are triggered on demand when training exercises are completed.

**Section sources**
- [src/jobs/config.ts:1-38](file://src/jobs/config.ts#L1-L38)
- [src/jobs/queues.ts:1-21](file://src/jobs/queues.ts#L1-L21)
- [src/jobs/index.ts:1-62](file://src/jobs/index.ts#L1-L62)

## Architecture Overview
The background job system integrates with the Next.js app through server actions and API routes. Workers run separately and consume jobs from Redis. Monitoring is available via an API endpoint and an admin page.

```mermaid
sequenceDiagram
participant Client as "Client"
participant ServerAction as "Server Action<br/>trainings/[id]/execute/actions.ts"
participant JobsIndex as "Jobs Index<br/>jobs/index.ts"
participant Queue as "Bull Queue<br/>jobs/queues.ts"
participant Worker as "Worker Process"
participant Processor as "Processor<br/>jobs/processors/*.ts"
participant DB as "Prisma/PostgreSQL"
Client->>ServerAction : Complete exercise / finish training
ServerAction->>JobsIndex : scheduleScoreCalculation(trainingId)
JobsIndex->>Queue : Add job {trainingId} with default options
Note over Queue : Stored in Redis
Worker->>Queue : Poll for jobs
Queue-->>Worker : Dequeue calculate-scores job
Worker->>Processor : Execute calculationScoreProcessor(job)
Processor->>DB : Read training exercises and related data
Processor-->>Worker : Return success or throw error
Worker-->>Queue : Mark job completed or retry based on attempts/backoff
```

**Diagram sources**
- [src/app/trainings/[id]/execute/actions.ts](file://src/app/trainings/[id]/execute/actions.ts#L440-L460)
- [src/jobs/index.ts:14-23](file://src/jobs/index.ts#L14-L23)
- [src/jobs/queues.ts:7-10](file://src/jobs/queues.ts#L7-L10)
- [src/jobs/processors/scores.ts:1-37](file://src/jobs/processors/scores.ts#L1-L37)

## Detailed Component Analysis

### Scores Queue and Processor
Purpose:
- Calculate scores for all exercises within a training after completion events.

Flow:
- Server action triggers scheduling of a score calculation job with the training ID.
- The worker dequeues the job and executes the processor.
- The processor reads training exercises and computes scores using core logic.
- On success, returns a summary; on failure, throws an error to trigger retries.

Retry strategy:
- Uses default job options: 3 attempts with exponential backoff.

```mermaid
flowchart TD
Start(["Job Enqueued"]) --> FetchExercises["Fetch training exercises"]
FetchExercises --> Loop{"For each exercise"}
Loop --> |Yes| ComputeScore["Compute score via core function"]
ComputeScore --> Loop
Loop --> |No| Success["Return success result"]
Success --> End(["Completed"])
```

**Diagram sources**
- [src/jobs/processors/scores.ts:1-37](file://src/jobs/processors/scores.ts#L1-L37)
- [src/jobs/index.ts:14-23](file://src/jobs/index.ts#L14-L23)

**Section sources**
- [src/jobs/processors/scores.ts:1-37](file://src/jobs/processors/scores.ts#L1-L37)
- [src/jobs/index.ts:14-23](file://src/jobs/index.ts#L14-L23)

### Periods Queue and Processor
Purpose:
- Check current training periods and end those inactive for more than a week.

Flow:
- Scheduled daily at midnight via cron.
- Processor finds all current periods and their most recent completed training.
- If no completed training exists or it is older than one week, the period is ended.
- Returns a summary of ended periods.

```mermaid
flowchart TD
Start(["Period Check Job"]) --> FindCurrent["Find current periods"]
FindCurrent --> OneWeekAgo["Compute one week ago"]
OneWeekAgo --> Iterate{"For each period"}
Iterate --> LastTraining{"Has last completed training?"}
LastTraining --> |No| EndPeriod["End current period"]
LastTraining --> |Yes| CompareDate{"completedAt < oneWeekAgo?"}
CompareDate --> |Yes| EndPeriod
CompareDate --> |No| NextPeriod["Next period"]
EndPeriod --> NextPeriod
NextPeriod --> Done["Return summary"]
```

**Diagram sources**
- [src/jobs/processors/periods.ts:1-66](file://src/jobs/processors/periods.ts#L1-L66)
- [src/jobs/index.ts:25-39](file://src/jobs/index.ts#L25-L39)

**Section sources**
- [src/jobs/processors/periods.ts:1-66](file://src/jobs/processors/periods.ts#L1-L66)
- [src/jobs/index.ts:25-39](file://src/jobs/index.ts#L25-L39)

### Images Queue and Processor
Purpose:
- Clean up orphaned image files stored under public/uploads that are not referenced in the database.

Flow:
- Scheduled daily at 3 AM via cron.
- Processor lists files in the uploads directory and compares against filenames stored in the database.
- Deletes files not found in the database and reports counts.

```mermaid
flowchart TD
Start(["Image Cleanup Job"]) --> EnsureDir{"Upload dir exists?"}
EnsureDir --> |No| ExitEarly["Exit early"]
EnsureDir --> |Yes| ListFiles["List files in uploads"]
ListFiles --> QueryDB["Query exerciseImage filenames"]
QueryDB --> BuildSet["Build set of db filenames"]
BuildSet --> FilterOrphaned["Filter orphaned files"]
FilterOrphaned --> DeleteLoop{"For each orphaned file"}
DeleteLoop --> |Yes| DeleteFile["Delete file"]
DeleteLoop --> |No| Report["Report deleted count"]
Report --> End(["Completed"])
```

**Diagram sources**
- [src/jobs/processors/images.ts:1-71](file://src/jobs/processors/images.ts#L1-L71)
- [src/jobs/index.ts:41-55](file://src/jobs/index.ts#L41-L55)

**Section sources**
- [src/jobs/processors/images.ts:1-71](file://src/jobs/processors/images.ts#L1-L71)
- [src/jobs/index.ts:41-55](file://src/jobs/index.ts#L41-L55)

### Scheduling and Integration Points
- Score calculation is scheduled from the training execution flow when exercises are finalized.
- Period checks and image cleanup are scheduled once at startup and repeated daily via cron.
- Monitoring endpoints expose queue statistics and active jobs.

```mermaid
sequenceDiagram
participant AdminUI as "Admin UI<br/>admin/jobs/page.tsx"
participant API as "API Route<br/>api/jobs/route.ts"
participant Queue as "Bull Queue"
participant Worker as "Worker"
participant Processor as "Processor"
AdminUI->>API : GET /api/jobs
API->>Queue : getJobCounts() and getActive()
Queue-->>API : Counts and active jobs
API-->>AdminUI : JSON status
Note over Worker,Processor : Workers poll queues and execute processors
```

**Diagram sources**
- [src/app/admin/jobs/page.tsx:1-204](file://src/app/admin/jobs/page.tsx#L1-L204)
- [src/app/api/jobs/route.ts:1-51](file://src/app/api/jobs/route.ts#L1-L51)

**Section sources**
- [src/app/trainings/[id]/execute/actions.ts](file://src/app/trainings/[id]/execute/actions.ts#L440-L460)
- [src/app/api/jobs/route.ts:1-51](file://src/app/api/jobs/route.ts#L1-L51)
- [src/app/admin/jobs/page.tsx:1-204](file://src/app/admin/jobs/page.tsx#L1-L204)

## Dependency Analysis
The job system has clear boundaries and minimal coupling:
- Config centralizes environment-dependent settings and constants.
- Queues depend on config and bind processors to job names.
- Index imports processors and exposes helpers for scheduling.
- Processors depend on Prisma and core business logic modules.
- App components integrate by calling index helpers and querying the API.

```mermaid
graph LR
Config["config.ts"] --> Queues["queues.ts"]
Queues --> ScoresProc["processors/scores.ts"]
Queues --> PeriodsProc["processors/periods.ts"]
Queues --> ImagesProc["processors/images.ts"]
Index["index.ts"] --> Queues
Index --> ScoresProc
Index --> PeriodsProc
Index --> ImagesProc
Actions["trainings/[id]/execute/actions.ts"] --> Index
API["api/jobs/route.ts"] --> Queues
Admin["admin/jobs/page.tsx"] --> API
```

**Diagram sources**
- [src/jobs/config.ts:1-38](file://src/jobs/config.ts#L1-L38)
- [src/jobs/queues.ts:1-21](file://src/jobs/queues.ts#L1-L21)
- [src/jobs/index.ts:1-62](file://src/jobs/index.ts#L1-L62)
- [src/jobs/processors/scores.ts:1-37](file://src/jobs/processors/scores.ts#L1-L37)
- [src/jobs/processors/periods.ts:1-66](file://src/jobs/processors/periods.ts#L1-L66)
- [src/jobs/processors/images.ts:1-71](file://src/jobs/processors/images.ts#L1-L71)
- [src/app/trainings/[id]/execute/actions.ts](file://src/app/trainings/[id]/execute/actions.ts#L440-L460)
- [src/app/api/jobs/route.ts:1-51](file://src/app/api/jobs/route.ts#L1-L51)
- [src/app/admin/jobs/page.tsx:1-204](file://src/app/admin/jobs/page.tsx#L1-L204)

**Section sources**
- [src/jobs/config.ts:1-38](file://src/jobs/config.ts#L1-L38)
- [src/jobs/queues.ts:1-21](file://src/jobs/queues.ts#L1-L21)
- [src/jobs/index.ts:1-62](file://src/jobs/index.ts#L1-L62)

## Performance Considerations
- Use separate worker processes for job execution to avoid blocking the main application thread.
- Keep jobs idempotent and small; process only necessary data per job.
- Leverage exponential backoff to handle transient failures gracefully.
- Monitor queue lengths and active jobs to detect bottlenecks.
- Ensure database connections are properly managed within processors to avoid leaks.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Redis connectivity problems: Verify REDIS_HOST and REDIS_PORT environment variables and ensure Redis is running.
- Jobs not executing: Confirm workers are started and listening to the correct queues.
- Frequent retries: Inspect processor logs for errors; check database queries and external dependencies.
- Orphaned images not cleaned: Validate filesystem permissions and upload directory path.
- Monitoring gaps: Ensure the API route is accessible and the admin page can fetch status.

Operational tips:
- Use the admin dashboard to refresh queue stats and view active jobs.
- Review job return values and stack traces to diagnose failures.
- Adjust retry strategies if specific jobs require different backoff behavior.

**Section sources**
- [src/app/api/jobs/route.ts:1-51](file://src/app/api/jobs/route.ts#L1-L51)
- [src/app/admin/jobs/page.tsx:1-204](file://src/app/admin/jobs/page.tsx#L1-L204)

## Conclusion
The Bull-based background job system provides robust asynchronous processing for scoring, period management, and image cleanup. With centralized configuration, clear queue definitions, and dedicated processors, the system scales well and remains maintainable. Monitoring via API and admin UI ensures visibility into job health and performance.

[No sources needed since this section summarizes without analyzing specific files]