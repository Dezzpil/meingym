# MeinGym Project Guidelines

This document provides essential information for developers working on the MeinGym project.

## Project Overview

MeinGym is a comprehensive gym/fitness tracking application that allows users to:
- Track workouts and exercises
- Monitor progression over time
- Score and evaluate training performance
- Manage training periods and progression strategies

Current version: 1.24.1

## Build/Configuration Instructions

### Prerequisites
- Node.js (version compatible with Next.js 14.2.30)
- PostgreSQL 16 database
- Redis (for background jobs)

### Environment Setup
1. Create a `.env.local` file in the project root with the following variables:
   ```
   DATABASE_PRISMA_URL="postgresql://username:password@localhost:5432/meingym?schema=public"
   DATABASE_URL_NON_POOLING="postgresql://username:password@localhost:5432/meingym?schema=public"
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Authentication Providers
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   GITHUB_APP_ID=your_github_app_id
   GITHUB_SECRET=your_github_secret
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=http://localhost:3004

   # Other
   NEXT_TELEMETRY_DISABLED=1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Development Server
Start the development server on port 3004:
```bash
npm run dev
```

### Background Workers
Start the background job workers (uses Bull with Redis):
```bash
npm run workers
```

### Production Build
Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

### Docker Setup
The project includes a `docker-compose.yml` file for setting up the database and Redis:
```bash
docker-compose up -d
```

## Testing Information

### Testing Framework
The project uses:
- Node.js built-in test module (`node:test`)
- Chai for assertions
- `tsx` for running TypeScript tests

### Running Tests
Run all tests:
```bash
npm test
```

Run core logic tests:
```bash
npm run test:core
```

Run specific tests:
```bash
node --import tsx path/to/test/file.test.ts
```

### Creating Tests
1. Create test files with the `.test.ts` extension
2. Place them in the `src/tests` directory, following the same structure as the source code
3. Import the test module and assertion library:
   ```typescript
   import { test } from "node:test";
   import { assert } from "chai";
   ```
4. Structure tests using the async context pattern:
   ```typescript
   test("Feature name", async (context) => {
     await context.test("should do something specific", () => {
       // Test code here
       assert.equal(result, expectedValue);
     });
   });
   ```

### Example Test
Here's a simple test for a math utility function:

```typescript
// File: src/tests/tools/math.test.ts
import { assert } from "chai";
import { test } from "node:test";
import { add, multiply } from "@/tools/math";

test("Math utility functions", async (context) => {
  await context.test("add function should correctly add two numbers", () => {
    assert.equal(add(2, 3), 5);
    assert.equal(add(-1, 1), 0);
    assert.equal(add(0, 0), 0);
  });

  await context.test("multiply function should correctly multiply two numbers", () => {
    assert.equal(multiply(2, 3), 6);
    assert.equal(multiply(-1, 1), -1);
    assert.equal(multiply(0, 5), 0);
  });
});
```

Run this test with:
```bash
node --import tsx src/tests/tools/math.test.ts
```

## Additional Development Information

### Project Structure
- `src/app`: Next.js application routes and pages
- `src/app/admin`: Admin dashboard and management
- `src/components`: React components
- `src/core`: Core business logic, domain models, and progression strategies
- `src/tools`: Utility functions and helpers
- `src/jobs`: Background job processing system (queues and processors)
- `src/scripts`: Maintenance and data update scripts
- `prisma`: Database schema and migrations

### Core Features & Logic
- **Progression System**: Logic for calculating the next workout's loads based on performance.
- **Training Periods**: Support for organizing workouts into periods with specific goals.
- **Feedback & Scoring**: Performance evaluation after each workout and set.
- **Warm-up Sets**: Support for warm-up logic in workouts.
- **Similar Exercises**: Ability to suggest or replace exercises with similar ones.
- **Exercise Media**: Support for images (PNG/JPG) and Markdown descriptions for exercises.

### Database ORM
The project uses Prisma ORM for database access:
- Schema is defined in `prisma/schema.prisma`
- Run migrations with `npm run prisma:migrate`
- Use `npx prisma studio` to explore data visually.

### Background Jobs System
The project uses Bull with Redis:
- Job queues are defined in `src/jobs/queues.ts`
- Job processors are in `src/jobs/processors/`
- Workers are started via `src/jobs/index.ts` (run `npm run workers`).

### Code Style & Commits
- **TypeScript**: Used throughout the project.
- **React**: Functional components with hooks.
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/). The project uses `standard-version` for release management.
- **Versioning**:
  - `npm run release:patch`: Patch release (bug fixes)
  - `npm run release:feature`: Minor release (new features)
  - `npm run release:breaking`: Major release (breaking changes)

### Authentication
The project uses NextAuth.js with Prisma adapter. Supported providers:
- Google
- GitHub
- VK (Check configuration as it might have limitations)

### Utility Scripts
The project includes several utility scripts:
- `npm run update-actions`: Update action data
- `npm run update-training-exercises`: Update training exercises
- `npm run update-approaches-groups`: Update approach groups
- `npm run collect-exercise-time`: Collect statistics for exercise execution time
