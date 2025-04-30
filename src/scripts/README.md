# Scripts Documentation

This directory contains utility scripts for maintaining and updating the MeinGym database.

## Available Scripts

### update-actions.ts

**Purpose**: Updates all actions in the database.

**Functionality**:
- Fetches all actions from the database with their associated muscles (agony, synergy, stabilizer)
- Updates each action using the `handleUpdate` function from the actions module
- Includes error handling for individual action updates
- Logs the progress and results of the update process

**Usage**:
```bash
npx tsx src/scripts/update-actions.ts
```

### update-training-exercises.ts

**Purpose**: Updates training exercises statistics and scores.

**Functionality**:
- Fetches all training exercises from the database
- For exercises with missing statistics (liftedMax or liftedCountMean equal to 0):
  - Retrieves all executions for that exercise
  - Calculates statistics based on the executions
  - Updates the exercise with the calculated values
- For exercises without a Score, creates a score using the `createScore` function
- Logs the progress and results of the update process

**Usage**:
```bash
npx tsx src/scripts/update-training-exercises.ts
```

### update-approaches-groups.ts

**Purpose**: Updates statistics for approach groups in the database.

**Functionality**:
- Fetches all approach groups from the database with their associated approaches
- For groups with missing statistics (max, countTotal, or countMean equal to 0):
  - Retrieves information needed for calculation
  - Calculates statistics based on the approaches
  - Updates the group with the calculated values
- Logs the progress and results of the update process

**Usage**:
```bash
npx tsx src/scripts/update-approaches-groups.ts
```

## Running Scripts

All scripts in this directory can be executed using the Node.js runtime with the TypeScript executor:

```bash
npx tsx src/scripts/<script-name>.ts
```

The scripts automatically load environment variables from the `.env` file using dotenv.
