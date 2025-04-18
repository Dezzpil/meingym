# Scripts Directory

This directory contains utility scripts for the MeinGym project.

## update-actions.ts

This script updates all actions/exercises in the database by calling the `handleUpdate` function for each action. It is used during the deployment process to ensure that all actions have the latest data structure and search terms.

### Purpose

The script serves to:
1. Fetch all actions from the database
2. Process each action by calling the `handleUpdate` function
3. Update the search terms and other fields for each action

### Usage

The script can be run manually with:

```bash
npm run update-actions
```

It is also automatically executed during the deployment process after the build step, as defined in the `deploy.sh` script.

### Implementation Details

The script:
1. Fetches all actions with their related muscle data
2. For each action, it prepares the data in the format expected by `handleUpdate`
3. Calls `handleUpdate` for each action
4. Handles errors and disconnects from the database when done

This ensures that all actions are up-to-date with the latest schema and search terms after deployment.