# Leon Ops Dashboard (SQLite-backed)

A modern task dashboard (Next.js App Router + shadcn/ui + Tailwind v4) that stores tasks in a local SQLite database (`better-sqlite3`).

> Note: This is the standalone dashboard app that backs the `/tasks` UI and `/api/tasks` endpoints. It no longer pulls directly from GitHub issues.

## Architecture Overview

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, shadcn/ui, Tailwind v4
- **Persistence:** SQLite via `better-sqlite3` (file: `data/tasks.db`)
- **Auth:** `next-auth` with GitHub/Google providers + `users` table
- **Key modules:**
  - `src/lib/db.ts` – database schema + CRUD for tasks/users + metrics
  - `src/lib/openclaw.ts` – helper to call the OpenClaw gateway tools API
  - `src/app/tasks/page.tsx` – main Tasks UI (list, filters, create modal)
  - `src/app/api/tasks/*` – task APIs (list, create, update, metrics)
  - `src/app/api/admin/users` – user admin API
  - `src/app/api/health` – lightweight health/diagnostics endpoint

### Database Schema

`data/tasks.db` is created on first access.

- **tasks**
  - `id` (TEXT, PK)
  - `project` (TEXT, nullable) – logical grouping (e.g., `echolyne`, `leon-dashboard`)
  - `category` (TEXT, NOT NULL)
  - `summary` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `status` (TEXT, NOT NULL)
    - One of: `Not Started`, `In Progress`, `Completed`, `Cancelled`, `On Hold`
  - `created_at` (INTEGER, unix ms)
  - `completed_at` (INTEGER, unix ms, nullable)
  - `reason` (TEXT)
  - `additional_comments` (TEXT)

- **users**
  - `id` (TEXT, PK)
  - `email` (TEXT, NOT NULL, UNIQUE)
  - `name` (TEXT)
  - `provider` (TEXT, NOT NULL) – `github` | `google` | `unknown`
  - `provider_id` (TEXT, NOT NULL)
  - `approved` (BOOLEAN, default `0`)
  - `created_at` (INTEGER, unix ms)
  - `role` (TEXT, default `'user'`) – `admin` | `user`

Indexes:

- `idx_users_email` on `users(email)`
- `idx_users_provider` on `users(provider, provider_id)`

### Core Endpoints

All paths are relative to the Next.js app.

#### `GET /api/tasks`

List tasks with optional filters.

Query params:

- `status` – optional, one of the `TaskStatus` values
- `category` – optional, string
- `project` – optional, string

Response:

```json
{
  "tasks": [
    {
      "id": "...",
      "category": "DevOps",
      "summary": "...",
      "description": "...",
      "status": "In Progress",
      "created_at": 1738710000000,
      "completed_at": null,
      "reason": null,
      "additional_comments": "..."
    }
  ]
}
```

#### `POST /api/tasks/create`

Create a new task.

#### `POST /api/tasks/[id]/update`

Update an existing task. This is the primary way Leon/sub-agents should mark tasks as `In Progress`, `Completed`, add reasons, or append comments.

Request body (JSON):

```json
{
  "status": "In Progress",           // optional, one of the TaskStatus values
  "completed_at": 1738712345678,      // optional, unix ms; usually only set when marking Completed
  "reason": "Blocked on whisper CLI",// optional, for Cancelled/On Hold
  "additional_comments": "Notes...", // optional, free-form comments
  "project": "echolyne"              // optional, override or set project
}
```

Example (bash) to mark a task `In Progress` and add a comment:

```bash
TASK_ID="1770257818683-kejjn12"
curl -X POST \
  "http://127.0.0.1:3100/api/tasks/${TASK_ID}/update" \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "In Progress",
    "additional_comments": "Auth tests added; waiting for pytest run."
  }'
```

On success, the API returns:

```json
{
  "task": { "id": "...", "status": "In Progress", ... }
}
```

If the `id` does not exist, the API returns `404` with `{ "error": "Task not found" }`.


Request body (JSON):

```json
{
  "project": "leon-dashboard",    // optional, for logical grouping
  "category": "DevOps",
  "summary": "Fix staging deploys",
  "description": "Optional longer description",
  "status": "Not Started",        // optional, defaults to "Not Started"
  "additional_comments": "notes"  // optional
}
```

Response (201):

```json
{
  "task": {
    "id": "generated-id",
    "category": "DevOps",
    "summary": "Fix staging deploys",
    "description": "Optional longer description",
    "status": "Not Started",
    "created_at": 1738710000000,
    "completed_at": null,
    "reason": null,
    "additional_comments": "notes"
  }
}
```

On validation error (missing `category` or `summary`): `400` with `{ "error": "..." }`.

On unexpected DB errors: `500` with `{ "error": "Failed to create task" }`.

#### `GET /api/tasks/metrics`

Returns aggregate metrics derived from the `tasks` table.

Optional query params:

- `project` – when provided, metrics are calculated only for tasks with that `project` value.

Response:

```json
{
  "metrics": {
    "total": 42,
    "byStatus": {
      "Not Started": 10,
      "In Progress": 20,
      "Completed": 8,
      "Cancelled": 2,
      "On Hold": 2
    },
    "byCategory": {
      "DevOps": 12,
      "Healthcare": 5
    },
    "completionRate": 19.0,
    "failureRate": 4.8,
    "last7Days": 7,
    "last30Days": 30
  }
}
```

#### `GET /api/health`

Simple health/diagnostics endpoint.

- Performs a lightweight DB access via `getMetrics()`.
- Returns `200` with `{ ok: true, metrics: { ... } }` when healthy.
- Returns `500` with `{ ok: false, error: "..." }` when DB or app wiring fails.

### `/tasks` UI Flow

- Fetches tasks via `GET /api/tasks` and metrics via `GET /api/tasks/metrics` on mount.
- Supports client-side filtering by `status` and `category`.
- Clicking **"+ New Task"** opens a modal that POSTs to `/api/tasks/create`.
- On success, the UI refetches tasks + metrics.

## Local Development

```bash
# From repo root
cd Leon-dashboard
npm install
npm run dev

# App runs on http://localhost:3000
```

### Environment

The dashboard uses a local SQLite file only and does not require external DB credentials.

For OpenClaw gateway integration (optional, used by `src/lib/openclaw.ts`):

```bash
export OPENCLAW_GATEWAY_URL="http://127.0.0.1:18789"   # default
export OPENCLAW_GATEWAY_TOKEN="..."                   # required to call tools
```

Do **not** commit `.env.local` files with secrets.

## Operational Notes

- The SQLite handle is managed as a singleton in `src/lib/db.ts`; API routes should not close it.
- If you see `SQLITE_MISUSE` or "database connection is not open" errors, check for accidental `db.close()` usage.
- Health check: `GET /api/health` should be wired into any external uptime / monitoring if desired.
