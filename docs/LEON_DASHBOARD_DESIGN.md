# Leon Dashboard Design & Architecture

This document describes the current architecture of the Leon operational task dashboard and how it satisfies the requirements in `LEON_DASHBOARD_REQUIREMENTS.md`.

## High-Level Overview

The dashboard is a small Next.js application backed by a local SQLite database. It is designed to be simple, transparent, and easy to operate.

- **Frontend:**
  - Next.js App Router
  - `/tasks` route provides the main task view
  - Uses basic React state + fetch for data loading
- **Backend:**
  - Next.js API routes under `/api/tasks` and `/api/tasks/metrics`
  - `better-sqlite3` for synchronous SQLite access
  - Thin `src/lib/db.ts` module encapsulates DB operations
- **Storage:**
  - SQLite file at `data/tasks.db`
  - Tables: `tasks`, `users`

## Data Model

### Task

Logical fields (see `src/lib/db.ts`):

```ts
export interface Task {
  id: string
  project?: string | null
  category: string
  summary: string
  description?: string
  status: TaskStatus
  created_at: number
  completed_at?: number
  reason?: string
  additional_comments?: string
}
```

`project` is an optional field used to group tasks by initiative (e.g., `echolyne`, `leon-dashboard`). It is allowed to be `NULL`/empty for generic tasks.

### User

Defined in `src/lib/db.ts` and used by the OAuth2-protected frontend to track which identities are approved.

## Database Schema

The schema is created on startup in `initTables(db)` inside `src/lib/db.ts`.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project TEXT,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  reason TEXT,
  additional_comments TEXT
);
```

A non-destructive migration is applied to existing databases by attempting to add the `project` column if it does not already exist.

```sql
ALTER TABLE tasks ADD COLUMN project TEXT;
```

The `users` table is unchanged:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);
```

Indexes are defined on `users.email` and `(users.provider, users.provider_id)` for fast lookups.

## Runtime Flow

### 1. Task Listing

- Route: `GET /api/tasks`
- Implementation: `src/app/api/tasks/route.ts`
- Behaviour:
  - Reads optional query parameters: `status`, `category`, `project`.
  - Constructs a filter object for `listTasks(filters)`.
  - Returns `{ tasks }` as JSON.

On the frontend, `src/app/tasks/page.tsx`:

- Fetches tasks on initial load via `fetch('/api/tasks')`.
- Stores them in React state.
- Derives distinct categories and projects for filter dropdowns.
- Applies in-memory filters by `status`, `category`, and `project`.

### 2. Task Creation

- Route: `POST /api/tasks/create`
- Implementation: `src/app/api/tasks/create/route.ts`
- Behaviour:
  - Validates `category` and `summary`.
  - Accepts optional `project`, `description`, `status`, and `additional_comments`.
  - Calls `createTask()` in `src/lib/db.ts`.
  - Returns the created task.

On the frontend, the **Create Task** modal:

- Local form state mirrors the creation payload:
  - `project`, `category`, `summary`, `description`, `status`, `additional_comments`.
- On submit:
  - Sends a JSON body to `/api/tasks/create`.
  - On success, closes the modal and refreshes task list + metrics.

### 3. Task Updates

- Route: `POST /api/tasks/[id]/update`
- Implementation: `src/app/api/tasks/[id]/update/route.ts`
- Behaviour:
  - Accepts a partial update body consistent with `UpdateTaskInput`.
  - Delegates to `updateTask(id, input)` in `src/lib/db.ts`.
  - `updateTask` encapsulates logic for:
    - Auto-setting `completed_at` on transition to `Completed`.
    - Clearing `completed_at` when leaving `Completed`.

The UI currently does not expose mutation controls; the route exists primarily for programmatic use by Leon/sub-agents.

### 4. Metrics

- Route: `GET /api/tasks/metrics`
- Implementation: `src/app/api/tasks/metrics/route.ts`
- Behaviour:
  - Uses `getMetrics()` from `src/lib/db.ts`.
  - Returns aggregate stats:
    - `total`, `byStatus`, `byCategory`, `completionRate`, `failureRate`, `last7Days`, `last30Days`.

Metrics are displayed on the `/tasks` page as simple cards.

## Project Field Wiring

The `project` field is wired end-to-end:

1. **Database**
   - Column `project TEXT` on `tasks` table.
   - Backfilled/migrated for existing DBs via a best-effort `ALTER TABLE` during init.

2. **Types**
   - `Task` has optional `project`.
   - `CreateTaskInput` and `UpdateTaskInput` accept optional `project`.

3. **API**
   - `/api/tasks` accepts `project` as a query parameter.
   - `/api/tasks/create` accepts `project` in the JSON body.

4. **UI**
   - Task cards and detail modal show `project` when present.
   - Create Task form includes a `project` field.
   - Filters include a `Project` dropdown with `All Projects` + discovered values.

## Operational Considerations

- The dashboard is intended to run as a systemd user service (`leon-dashboard.service`) and fronted by an OAuth2 proxy / Nginx.
- Admin approval is required for new users; role is stored on the `users` table and used by the frontend.
- The codebase is intentionally small and straightforward to make it easy for Leon to modify and extend.

## Future Extensions

Some directions that can be layered on top of this design:

- Project-aware metrics (`byProject`).
- Task timeline / history (status changes over time).
- Linking tasks to external systems (GitHub issues, cron jobs, sub-agent sessions).
- Better comments / activity logs per task.