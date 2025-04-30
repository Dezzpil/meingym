# MeinGym Project Guidelines

This document provides essential information for developers working on the MeinGym project.

## Build/Configuration Instructions

### Prerequisites
- Node.js (version compatible with Next.js 14.0.4)
- PostgreSQL database
- Redis (for background jobs)

### Environment Setup
1. Create a `.env.local` file in the project root with the following variables:
   ```
   DATABASE_PRISMA_URL=postgresql://username:password@localhost:5432/meingym
   DATABASE_URL_NON_POOLING=postgresql://username:password@localhost:5432/meingym
   REDIS_HOST=localhost
   REDIS_PORT=6379
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
Start the background job workers:
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

### Running Tests
Run all tests:
```bash
npm test
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
- `src/components`: React components
- `src/core`: Core business logic and domain models
- `src/tools`: Utility functions and helpers
- `src/jobs`: Background job processing system
- `prisma`: Database schema and migrations

### Database ORM
The project uses Prisma ORM for database access:
- Schema is defined in `prisma/schema.prisma`
- Database models include User, Action, Training, TrainingPeriod, etc.
- Run migrations with `npm run prisma:migrate`

### Background Jobs System
The project uses Bull with Redis for background job processing:
- Job queues are defined in `src/jobs/queues.ts`
- Job processors are in `src/jobs/processors/`
- Configuration is in `src/jobs/config.ts`
- Start workers with `npm run workers`
- Schedule jobs using helper functions in `src/jobs/index.ts`

### Code Style
- TypeScript is used throughout the project
- React components use functional style with hooks
- Next.js App Router pattern is used for routing
- JSDoc comments are used for documenting functions

### Versioning
The project uses standard-version for release management:
- `npm run release:patch`: Patch release (bug fixes)
- `npm run release:feature`: Minor release (new features)
- `npm run release:breaking`: Major release (breaking changes)

### Authentication
The project uses NextAuth.js for authentication with Prisma adapter.

### Utility Scripts
The project includes several utility scripts:
- `npm run update-actions`: Update action data
- `npm run update-training-exercises`: Update training exercises
- `npm run update-approaches-groups`: Update approach groups
