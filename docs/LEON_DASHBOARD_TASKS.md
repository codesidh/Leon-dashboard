# Leon Dashboard Task List

This is the living task list for the Leon operational dashboard. It should reflect the current and planned work so that Leon and Sridhar can see what remains.

Status legend:
- [ ] Not started
- [~] In progress
- [x] Completed

## M1 – Core Task Tracking (DONE)

- [x] Store tasks in SQLite with id, category, summary, description, status, created_at, completed_at, reason, additional_comments.
- [x] Basic `/tasks` page showing tasks and simple metrics.

## M2 – Project Field & Docs (CURRENT)

### Schema & Types

- [ ] Add `project` column to `tasks` table (TEXT, nullable).
- [ ] Implement non-destructive migration path for existing DBs (best-effort `ALTER TABLE` on init).
- [ ] Extend `Task`, `CreateTaskInput`, and `UpdateTaskInput` types to include optional `project`.

### API & Metrics

- [ ] Update `GET /api/tasks` to accept a `project` query parameter.
- [ ] Update `POST /api/tasks/create` to accept `project` in the request body.
- [ ] Add `/api/tasks/[id]/update` route that forwards to `updateTask`.
- [ ] (Optional, later) Extend metrics to include `byProject`.

### UI

- [ ] Show `project` on task cards and in the detail modal.
- [ ] Add `project` field to the Create Task form.
- [ ] Add `Project` filter (All + discovered projects) to the `/tasks` page.

### Documentation

- [x] Add `docs/LEON_DASHBOARD_REQUIREMENTS.md`.
- [x] Add `docs/LEON_DASHBOARD_DESIGN.md`.
- [x] Add `docs/LEON_DASHBOARD_TASKS.md` (this file).

## M3 – Fully Operational for Workflow

Goal: The dashboard should feel “done enough” for Sridhar’s real workflow: tracking work across projects, understanding completion/failure patterns, and giving Leon/sub-agents a single source of truth.

### Task Visibility & Usability

- [ ] Verify that for each task, the UI clearly shows:
  - `id`, `project`, `category`, `summary`, `description`,
  - `status`, `reason`, `created_at`, `completed_at`,
  - `additional_comments`.
- [ ] Make sure the layout remains readable with many tasks.

### Metrics & Insight

- [ ] Confirm that the existing metrics (completion/failure rate, byStatus, byCategory) are correct.
- [ ] Add a simple way (even manually for now) to reason about performance by project using filters + metrics.

### Integration with Leon’s Flow

- [ ] Document (in README) how Leon/sub-agents should create/update tasks via the API.
- [ ] Optionally, add a small example script or curl snippets for creating/updating tasks.

## Notes

- This file should be updated as tasks are completed or new ones are identified.
- When a milestone (M2, M3, etc.) is effectively complete, mark its items as `[x]` and, if needed, create a new milestone section for further improvements.