# Operations Runbook

This document lists the canonical project commands and where supporting scripts live.

## Canonical npm commands

- `npm run dev` — start the application in development mode.
- `npm run build` — build the production bundle.
- `npm run start` — run the production server from `dist/`.
- `npm run check` — run TypeScript type checks.

## Database + migration commands

- `npm run db:push` — push current Drizzle schema to the database (development convenience).
- `npm run db:reset` — clear demo data without dropping the schema (`scripts/db/reset-db.cjs`).
- `npm run db:reset:schema` — drop/recreate the schema (`scripts/db/reset-schema.cjs`).
- `npm run db:seed` — seed demo users and records (`scripts/db/run-seed.mjs`).
- `npm run db:check` — run quick DB connectivity checks (`scripts/db/check-db.cjs`).
- `npm run db:migrate:apply` — apply SQL migrations in order (`scripts/migrations/apply-migrations.cjs`).

## Higher-level workflows

- `npm run dev:db` — reset schema, push schema, seed demo data.
- `npm run demo:setup` — reset demo data, seed demo data, and start dev server.
- `npm run dev:demo` — run in file-backed demo mode (no Postgres required).

## Script locations

- `scripts/db/` — DB reset, seeding, inspection, and SQL helpers.
- `scripts/migrations/` — migration runners and migration-related one-offs.
- `scripts/debug/` — debug-only scripts and deprecated one-off helpers.

## Deprecated scripts

The following scripts are retained only for traceability/debugging and should not be used for regular operations:

- `scripts/debug/deprecated/direct-migrate.mjs`
- `scripts/debug/deprecated/run-migration-force.mjs`
- `scripts/debug/deprecated/temp-migrate.mjs`

Use `npm run db:migrate:apply` for normal migration application.
