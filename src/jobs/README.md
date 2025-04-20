# Background Jobs System for MeinGym

This directory contains the implementation of a background job processing system for MeinGym using Bull and Redis.

## Overview

The background job system allows you to run time-consuming tasks asynchronously, without blocking the main application thread. This is particularly useful for tasks like:

- Updating large sets of data
- Processing user data
- Generating reports
- Sending emails
- Any other task that might take a significant amount of time

## Architecture

The system consists of the following components:

1. **Redis**: Used as the message broker and storage for job data
2. **Bull**: A Node.js library for creating and managing job queues
3. **Queue Definitions**: Define different queues for different types of jobs
4. **Job Processors**: Process jobs from the queues
5. **API**: Endpoints for monitoring and managing jobs
6. **UI**: A simple dashboard for monitoring job status

## Directory Structure

```
src/jobs/
├── index.ts              # Main entry point and helper functions
├── queues.ts             # Queue definitions
├── config.ts             # Configuration for queues and jobs
├── processors/           # Job processors
│   └── scores.ts         # Processors for training exercise scores jobs
└── README.md             # This file
```

## How to Use

### Starting the Workers

To start the job processors (workers), run:

```bash
npm run workers
```

This will start all job processors defined in the `src/jobs/processors/` directory.

### Scheduling Jobs

You can schedule jobs in two ways:

1. **Using the API**:
   ```http
   POST /api/jobs
   Content-Type: application/json

   {
     "action": "update-all-actions"  // This value comes from jobNames.actions.updateAllActions
   }
   ```

2. **Using the helper functions**:
   ```typescript
   import { scheduleActionsUpdate } from '@/jobs';

   // Schedule a job to update all actions
   const { jobId } = await scheduleActionsUpdate();
   console.log(`Job scheduled with ID: ${jobId}`);
   ```

3. **Using the CLI script**:
   ```bash
   npm run update-actions:bull
   ```

### Monitoring Jobs

You can monitor jobs in two ways:

1. **Using the API**:
   ```http
   GET /api/jobs
   ```

2. **Using the UI Dashboard**:
   Navigate to `/admin/jobs` in your browser to see the job monitoring dashboard.

## Available Queues

All queue and job names are defined in `src/jobs/config.ts`:

1. **actionsQueue** (`queueNames.actions`): For processing action-related jobs
   - `jobNames.actions.updateAllActions`: Updates all actions in the database

2. **usersQueue** (`queueNames.users`): For processing user-related jobs
   - `jobNames.users.processUserData`: Processes data for a specific user

## Adding New Job Types

To add a new job type:

1. Create a new processor in the appropriate file in `src/jobs/processors/`
2. Add a helper function in `src/jobs/index.ts` to schedule the job
3. Update the API and UI if needed

Example:

```typescript
// First, add the new job name to the config file (src/jobs/config.ts)
export const jobNames = {
  scores: {
    updateAllActions: 'update-all-actions'
  },
  users: {
    processUserData: 'process-user-data',
    sendWelcomeEmail: 'send-welcome-email'  // Add this line
  }
};
```

## Configuration

All configuration for the background job system is centralized in `src/jobs/config.ts`. This includes:

1. **Redis Connection Settings**:
   ```typescript
   export const redisConfig = {
     host: process.env.REDIS_HOST || 'localhost',
     port: parseInt(process.env.REDIS_PORT || '6379')
   };
   ```

2. **Queue Names**:
   ```typescript
   export const queueNames = {
     actions: 'actions-processing',
     users: 'users-processing'
   };
   ```

3. **Job Names**:
   ```typescript
   export const jobNames = {
     actions: {
       updateAllActions: 'update-all-actions'
     },
     users: {
       processUserData: 'process-user-data'
     }
   };
   ```

4. **Default Job Options**:
   ```typescript
   export const defaultJobOptions = {
     attempts: 3,
     backoff: {
       type: 'exponential' as const,
       delay: 5000
     },
     removeOnComplete: true
   };
   ```

You can override the Redis connection settings by setting the `REDIS_HOST` and `REDIS_PORT` environment variables.

## Best Practices

1. **Keep jobs small and focused**: Each job should do one thing well
2. **Handle errors gracefully**: Jobs should handle errors and not crash the worker
3. **Use appropriate retry strategies**: Configure retry attempts and backoff strategies based on the job type
4. **Monitor job queues**: Regularly check for failed jobs and address issues
5. **Clean up completed jobs**: Use `removeOnComplete` to prevent the queue from growing too large
