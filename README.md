# MeinGym

MeinGym is a web app designed to help in plan, execution, and tracking gym workouts with respect to progression and periods in training.

## Features

- Training period management
- Exercise tracking and history
- Progress visualization with charts
- Workout planning and scheduling
- Performance scoring and analytics
- Background job processing for data updates

## Tech Stack

- **Frontend**: Next.js 14, React, Bootstrap
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Background Jobs**: Bull with Redis
- **Testing**: Node.js test module with Chai

## Getting Started

### Prerequisites

- Node.js (compatible with Next.js 14.0.4)
- PostgreSQL database
- Redis (for background jobs)

### Setup

1. Clone the repository
2. Set up environment variables:
   ```bash
   # Create .env.local file with:
   DATABASE_PRISMA_URL=postgresql://username:password@localhost:5432/meingym
   DATABASE_URL_NON_POOLING=postgresql://username:password@localhost:5432/meingym
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Start the background workers (optional):
   ```bash
   npm run workers
   ```

## Development

For more detailed development guidelines, see the [Project Guidelines](./.junie/guidelines.md).

### Common Commands

```bash
# Development
npm run dev                    # Start development server on port 3004
npm test                       # Run all tests
npm run workers                # Start background job workers

# Database
npm run prisma:migrate         # Run database migrations

# Releases
npm run release:patch          # Create a patch release
npm run release:feature        # Create a minor release
npm run release:breaking       # Create a major release
```

## Version

Current version: 1.12.0
