# Architecture

This document describes the primary module boundaries in DRC Capstone and how data flows across backend, frontend, and shared contracts.

## High-level structure

- **Backend**: `server/`
- **Frontend**: `client/src/`
- **Shared contracts**: `shared/`

The intended backend layering is:

> **routes → services → storage**

The intended frontend organization is:

> **routes/pages/hooks/components**

## Backend boundaries (`server/`)

### 1) Routes layer

Location:
- `server/routes.ts`
- `server/routes/*.routes.ts`

Responsibilities:
- Register HTTP paths and methods.
- Parse request params/query/body.
- Handle status codes and response shaping.
- Delegate business operations to services.

Constraints:
- Keep route handlers thin.
- Avoid embedding heavy business rules directly in route files.

### 2) Services layer

Location:
- `server/services/*.ts`

Responsibilities:
- Encode business logic and workflow rules.
- Coordinate multiple repositories/providers.
- Enforce domain constraints before persistence.

Constraints:
- Services should be independent from HTTP request/response objects.
- Keep side effects explicit and testable.

### 3) Storage layer

Location:
- `server/storage/*.ts`
- `server/storage/*.repo.ts`
- `server/db.ts`

Responsibilities:
- Execute database/file operations.
- Map DB records to domain-friendly structures.
- Isolate query details from business logic.

Constraints:
- Do not put route/HTTP concerns in storage.
- Keep database evolution aligned with `migrations/` and `shared/schema.ts`.

## Frontend boundaries (`client/src/`)

### 1) Routes/pages

Location:
- Route wiring: `client/src/App.tsx`
- Pages: `client/src/pages/**`

Responsibilities:
- Define navigation-level screens.
- Compose hooks + components for each feature view.

### 2) Hooks

Location:
- `client/src/hooks/**`

Responsibilities:
- Encapsulate data fetching, mutation, and cache behavior.
- Keep async/state orchestration out of presentational components.

### 3) Components

Location:
- `client/src/components/**`

Responsibilities:
- Provide reusable UI and localized interaction logic.
- Render data passed from pages/hooks.

Constraints:
- Keep components focused on rendering and small interactions.
- Move API/state orchestration to hooks whenever possible.

## Shared contracts (`shared/`)

### `shared/schema.ts`

Source of truth for:
- Drizzle table definitions.
- Zod schemas used across layers.
- Shared types derived from schema structures.

### `shared/routes.ts`

Source of truth for:
- API endpoint definitions (method + path).
- Input schema expectations.
- Response shape contracts.

## Cross-layer change flow

When changing an API or entity:

1. Update schema/contracts in `shared/schema.ts` and `shared/routes.ts`.
2. Update backend route/service/storage pipeline to satisfy new contracts.
3. Update frontend hooks/pages/components to consume the updated shapes.
4. Validate with type-check/build before merge.

## Safe refactor checklist

### Rename endpoints safely

- [ ] Add temporary compatibility route(s) if zero-downtime migration is needed.
- [ ] Update route files in `server/routes/*.routes.ts`.
- [ ] Update route registration entrypoints if needed (`server/routes.ts`).
- [ ] Update `shared/routes.ts` paths and schemas.
- [ ] Update all frontend callers (hooks/pages/components).
- [ ] Validate no stale hardcoded endpoint strings remain.

### Add fields safely

- [ ] Update table + Zod schemas in `shared/schema.ts`.
- [ ] Add corresponding SQL migration in `migrations/`.
- [ ] Update storage reads/writes and service logic.
- [ ] Update route handlers for request/response serialization.
- [ ] Update frontend forms/views for optional/defaulted states.
- [ ] Validate backfill/nullability handling for existing data.

### Update schema/types safely

- [ ] Keep `shared/schema.ts` and `shared/routes.ts` in sync.
- [ ] Re-run type-check (`npm run check`).
- [ ] Run build validation (`npm run build`).
- [ ] Verify runtime behavior with `npm run dev` or `npm run dev:demo`.

## Agent guidance

Preferred command set for static inspection and validation:

### Static inspection

- `rg --files server client shared`
- `rg "register.*Routes|api|schema|service" server shared client/src`
- `find server -maxdepth 2 -type d | sort`
- `find client/src -maxdepth 2 -type d | sort`

### Validation

- `npm run check`
- `npm run build`
- `npm run dev:db` (database-backed workflow validation)
- `npm run dev:demo` (demo/file-storage workflow validation)

For contract-heavy changes, always run at least `npm run check` prior to commit.
