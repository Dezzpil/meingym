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
2. Create apps in GitHub or Google, to auth with NextAuth.js
3. Copy .env.dist to .env.local 
4. Set the environment variables in .env.local
5. Install dependencies:
   ```bash
   npm ci
   ```
6. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```
8. Start the background workers (optional):
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

### Import dumps 

1. Copy the dump file to the project `PROJECT_DIR/dumps`
2. Use psql from docker-container to import the dump from `/dumps` directory inside the container:
   ```bash
   /usr/bin/docker exec -i -t /meingym-db-1 /bin/bash
   psql --file="/dumps/meingym-2025_10_28_17_34_03.sql" --single-transaction --username=postgres --host=localhost --port=5432 meingym
   ```

## Version

Current version: 1.21.4
