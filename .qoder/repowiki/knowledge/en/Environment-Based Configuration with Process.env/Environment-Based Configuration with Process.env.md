---
kind: configuration_system
name: Environment-Based Configuration with Process.env
category: configuration_system
scope:
    - '**'
source_files:
    - .env.dist
    - src/jobs/config.ts
    - src/tools/auth.ts
    - src/tools/db.ts
    - docker-compose.yml
    - package.json
---

The MeInGym application uses a straightforward environment-variable-based configuration system centered around `.env` files and direct `process.env` access throughout the codebase. There is no centralized configuration loader, validation layer, or typed config object — each module reads its needed values directly from `process.env` at runtime.

**Configuration sources and loading:**
- A single `.env.dist` template file documents all required and optional environment variables (database URLs, OAuth secrets, Redis settings, mobile auth tokens, etc.). Developers copy this to `.env.local` for local development.
- Prisma CLI commands (`prisma:migrate`, `prisma:format`) are wired via `dotenv-cli` to load `.env.local` before executing migrations.
- The Next.js app itself relies on Next.js's built-in `process.env` resolution; `next.config.js` is intentionally empty and adds no custom config logic.
- Background job workers (`src/jobs/config.ts`) read Redis connection settings directly from `REDIS_HOST` and `REDIS_PORT` with hardcoded defaults (`localhost:6379`).

**Where configuration is consumed:**
- Database: `DATABASE_PRISMA_URL` and `DATABASE_URL_NON_POOLING` are used by Prisma client initialization in `src/tools/db.ts`.
- Authentication: GitHub/Google OAuth credentials (`GITHUB_APP_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are consumed in `src/tools/auth.ts` when constructing NextAuth providers.
- Mobile API: HMAC/JWT secrets and timing windows (`MOBILE_HMAC_SECRET`, `MOBILE_JWT_SECRET`, `MOBILE_JWT_EXPIRES_IN_SECONDS`, `MOBILE_TIMESTAMP_WINDOW_SECONDS`, `MOBILE_APP_TOKEN`) are read in `src/mobile/tools/hmac.ts` and `src/mobile/tools/jwt.ts`.
- Jobs subsystem: Redis host/port in `src/jobs/config.ts`; queue/job name constants are defined inline as string literals.
- Tests: Test files set `process.env` values directly at the top of test suites to mock secrets and timing parameters.

**Architecture and conventions:**
- No schema validation or type safety on environment variables — values are cast with `as string` or parsed with `parseInt()` at the point of use.
- Defaults are provided inline where possible (e.g., Redis defaults to `localhost:6379`, timestamp window defaults to `300` seconds).
- Secrets are never committed; `.env.local` is gitignored while `.env.dist` serves as the source-of-truth template.
- Docker Compose defines service-level environment variables for PostgreSQL and Redis containers but does not inject app-level env vars into the Next.js container.

**Rules developers should follow:**
- Add new environment variables to `.env.dist` with clear comments so teammates know what needs to be configured.
- Always provide sensible defaults in code using `||` fallbacks rather than failing fast — the codebase consistently uses this pattern.
- Do not create a separate config module; instead, read `process.env` directly in the module that needs the value, keeping configuration close to usage.
- When adding new services (e.g., external APIs), document their required env vars in `.env.dist` and add corresponding `|| default` handling in the consuming code.