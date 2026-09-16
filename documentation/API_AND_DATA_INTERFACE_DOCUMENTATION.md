# WorkWise AI API and Data Interface Documentation

## Overview

This document describes the API endpoints and data interfaces used by the WorkWise AI alpha application. The interfaces connect the user-facing application to task storage, Smart Task Extraction, and task prioritization.

## API Endpoints

### GET `/api/tasks`

Returns the current task list, excluding rejected tasks.

- Retrieves tasks from the data layer.
- Excludes tasks with a rejected status.
- Applies the task prioritization algorithm.
- Returns tasks with priority scores and reasoning information.

### POST `/api/ingest`

Processes raw text from an email, chat message, or calendar description.

**Request data:**
- `text` — raw message content.
- `source` — identifies the source, such as email, chat, or manual input.

**Response:**
- Suggested task title.
- Suggested deadline.
- Suggested subtasks.
- Confidence value.
- Extraction mode.
- Reasoning log.

The suggestion is not saved automatically. It must go through the user's approval or editing process.

### POST `/api/tasks`

Creates an approved task.

**Request data may include:**
- `title`
- `deadline`
- `subtasks`
- `source`
- `importance`
- `extractionReasoning`

The server assigns the task an ID and records it as approved.

### PUT `/api/tasks/:id`

Updates an existing task.

Supported task information includes:
- Title
- Deadline
- Importance
- Manual priority override
- Subtasks
- Status

### DELETE `/api/tasks/:id`

Removes a task using its task ID.

## Task Data Interface

The alpha stores task records in a JSON data file through the database module. The data interface is designed around functions that can later be connected to PostgreSQL without requiring changes to the higher-level application logic.

Core data operations include:

- `getAll()`
- `getById(id)`
- `insert(task)`
- `update(id, patch)`
- `remove(id)`

## AI and Prioritization Integration

The Smart Task Extractor produces task suggestions that can be passed to the task API after human approval.

The prioritization module calculates a priority score using:

- Deadline urgency
- Source weight
- User-defined importance

Each calculated priority includes a reasoning log so the ranking can be inspected by the user.

Manual priority overrides are also supported so users remain in control of task ranking.

## Error Handling

The API validates required input and returns appropriate error responses for invalid requests, missing tasks, unknown endpoints, and server-side errors.

The Smart Task Extractor also falls back to heuristic processing if the optional LLM request fails or produces invalid output.

## Alpha Considerations

The current interface is designed for the alpha release and uses a lightweight JSON-file data store instead of the team's planned PostgreSQL implementation. This keeps the alpha easy to run while preserving a data interface that can support a future database migration.
