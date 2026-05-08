# Changelog

All notable changes are documented here.
Format: `## [vX.Y.Z] - YYYY-MM-DD` followed by categorized entries.

> **Historical functionality** (player deed tracking, resource production analytics,
> region overview, planning tools, player efficiency, market insights, card collection)
> is described in separate posts on PeakD. Starting from v1.0.0 all new features and
> changes will also be documented here.

---

## [Unreleased]

---

## [v1.0.0] - 2026-05-08

### Summary

First versioned release. Establishes the production infrastructure: multi-stage
Docker image with standalone Next.js output, a dedicated long-running worker
process, DB-based structured logging, and an admin dashboard with live job status
and manual trigger support.

### Added

#### Docker Infrastructure

- **Multi-stage Dockerfile** (`base → builder → runner`) replacing the previous
  single-stage build. The runner image contains only production artefacts —
  standalone Next.js output, worker source, and globally pinned CLI tools
  (`prisma`, `tsx`, `dotenv`). Significantly smaller final image.
- **Non-root user** (`nextjs:nodejs`) in the runner stage for improved container
  security.
- **Reproducible builds** — switched from `npm install` to `npm ci`.
- **Dummy `DATABASE_URL` build arg** — `prisma generate` no longer requires a
  real database at build time; the ARG is scoped to the builder stage only.
- **`APP_VERSION` build arg** — version string is baked into the image at CI
  build time and exposed as `process.env.APP_VERSION` at runtime.
- **Separate service containers** in `docker-compose.yml`:
  - `migrate` — one-shot init container that runs `prisma migrate deploy` before
    `app` and `worker` start. Exits with code 0 on success; restarts are disabled.
  - `worker` — long-running process running the background data pipeline.
  - `app` — the Next.js web application.
- **`docker-entrypoint.sh`** — updated to `exec node server.js` (standalone output).
- **`docker-entrypoint-worker.sh`** — updated with explicit `--tsconfig` flag.

#### Worker Process (`src/scripts/worker.ts`)

- Long-running Node.js process with two independent schedule loops:
  - **Daily loop** — triggers at 01:00 AM local time.
  - **Weekly loop** — triggers on Sunday at 02:00 AM local time.
- **Graceful shutdown** (`src/scripts/lib/graceful-shutdown.ts`) — handles
  `SIGTERM`/`SIGINT` with `interruptibleSleep` so containers stop cleanly.
- **Stale run recovery** — on startup, any `WorkerRun` records stuck in
  `running` status are marked `failed` (handles unclean restarts).

#### DB-Based Logging

- **Removed Winston** — no more file-system log files or the `winston` dependency.
- **`Log` Prisma model** — structured logs are written to the `logs` DB table with
  `level`, `message`, `meta` (JSON), and `created_at`.
- **`logger.server.ts`** rewritten — console output in development + fire-and-forget
  DB write. Exports `logger.info/warn/error(message, meta?)` and `logError(ctx, err)`.
- **Log pruning** — daily job prunes log entries older than 5 days.

#### Job Tracking

- **`WorkerRun` Prisma model** — records `job_type`, `status`
  (`running`/`completed`/`failed`), `started_at`, `finished_at`, `duration_ms`,
  and optional `error` per run.
- **Worker run pruning** — daily job prunes `WorkerRun` records older than 30 days.
- **`dataJobs.ts`** shared service — `runDailyJob()`, `runWeeklyJob()`, and
  `runJobWithTracking()` are shared between the worker process and the admin
  manual-trigger action; no duplicate pipeline logic.

#### Admin Dashboard

- **Worker Status section** — shows last run details (status chip, started,
  finished, duration, error) for the daily and weekly jobs.
- **"Run now" buttons** — manually trigger a daily or weekly job from the admin
  UI. Guards against duplicate runs (blocked if a run is already `running`).
  Uses `setImmediate` for fire-and-forget execution so the HTTP response is
  immediate.
- **Auto-polling** — the Worker Status section polls `getWorkerRunStatus()` every
  5 seconds while any job is in `running` state.
- **DB-backed log viewer** rewritten — paginated log table with level filter and
  text search. Replaces the previous file-system log reader.
- **Version display** — admin page shows the `APP_VERSION` baked in at build time.

#### CI/CD

- **`ci.yml`** — builds and pushes `gamerbeaker/splinter-lands-next:latest` on
  every push to `main`; build-only check on pull requests.
- **`release.yml`** — triggered by `v*` tags. Builds and pushes a versioned Docker
  image, extracts the changelog entry for that version, and creates a GitHub
  Release with full setup instructions.
- **`.env.example`** — documents all required environment variables.
