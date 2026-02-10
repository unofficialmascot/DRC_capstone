# Contributing

Thanks for contributing to DRC Capstone. This guide focuses on how the codebase is laid out, which conventions to follow, and where to apply common changes safely.

## Project layout

- `client/`: React + Vite frontend.
  - `client/src/pages/`: route-level pages.
  - `client/src/components/`: reusable UI components.
  - `client/src/hooks/`: data and UI hooks.
  - `client/src/lib/`: shared client helpers (`queryClient`, utilities).
- `server/`: Express + TypeScript backend.
  - `server/routes/`: HTTP route registration by domain.
  - `server/services/`: business logic/use-case layer.
  - `server/storage/`: persistence + repository layer.
  - `server/routes.ts`: top-level route wiring.
- `shared/`: cross-layer contracts.
  - `shared/schema.ts`: Drizzle schema + shared Zod insert schemas.
  - `shared/routes.ts`: API contract metadata + input/response schemas.
- `migrations/`: SQL migrations for schema evolution.
- `docs/`: project docs and guides.

## Coding conventions

- Use TypeScript everywhere (`client`, `server`, `shared`) and keep types strict (`tsconfig.json` has `strict: true`).
- Keep backend flow layered:
  1. **routes** parse/validate request data and return HTTP responses.
  2. **services** hold business rules.
  3. **storage/repos** talk to DB/files.
- Keep frontend flow composable:
  - pages orchestrate UX and route behavior.
  - hooks own data-fetching and stateful logic.
  - components focus on reusable presentation.
- Reuse shared contracts instead of duplicating request/response types:
  - add/adjust Zod and table-derived schemas in `shared/schema.ts`.
  - mirror API shape updates in `shared/routes.ts`.
- Use existing alias conventions:
  - `@/*` for client imports.
  - `@shared/*` for shared imports.

## Common workflows

### Local development

- Install dependencies:
  - `npm install`
- Start backend/frontend dev server:
  - `npm run dev`

### Database-backed local setup (reset + seed)

- Rebuild local schema and seed demo records:
  - `npm run dev:db`

### Demo/file-storage mode

- Run app without local Postgres using demo JSON store:
  - `npm run dev:demo`

### Build and type-check

- Type-check:
  - `npm run check`
- Production build:
  - `npm run build`

## Where to change what

### Add or change an API endpoint

1. Add/update the route handler in `server/routes/*.routes.ts`.
2. Add/update service methods in `server/services/*Service.ts`.
3. Add/update repository/storage access in `server/storage/*.repo.ts` or `server/storage/*.ts`.
4. Reflect contract changes in `shared/routes.ts` and `shared/schema.ts`.
5. Update frontend consumers in hooks/pages as needed.

### Add or change a database field

1. Update table definition + relevant Zod schemas in `shared/schema.ts`.
2. Add a migration under `migrations/`.
3. Update storage repositories, service logic, and route serialization.
4. Update client hooks/components that read/write that field.

### Add a new page/feature on frontend

1. Create/modify page in `client/src/pages/`.
2. Add reusable UI in `client/src/components/`.
3. Add data hooks in `client/src/hooks/`.
4. Wire route in `client/src/App.tsx`.

## Safe refactor checklist

Use this checklist when changing API names, payload shapes, or shared schemas.

### Renaming endpoints safely

- [ ] Add a temporary compatibility route (old + new) when possible.
- [ ] Update route registrations in `server/routes.ts` and specific `server/routes/*.routes.ts` files.
- [ ] Update `shared/routes.ts` path constants and request/response schemas.
- [ ] Update all frontend call sites (hooks/pages/components) that build URLs or invoke fetches.
- [ ] Verify request/response handling in backend services and storage remains intact.
- [ ] Remove deprecated endpoint only after all callers are migrated.

### Adding fields safely

- [ ] Add field to table + insert/update/select schema in `shared/schema.ts`.
- [ ] Add migration script in `migrations/` for production-safe evolution.
- [ ] Ensure backend services populate/default/validate the field.
- [ ] Ensure storage layer reads/writes the field correctly.
- [ ] Update frontend forms, hooks, and rendering logic for new/optional states.
- [ ] Validate nullability and backward compatibility for existing records.

### Updating shared schema/types safely

- [ ] Update Zod contracts in `shared/schema.ts` and route contracts in `shared/routes.ts` together.
- [ ] Re-run type-check to catch downstream breakage.
- [ ] Confirm server response serialization still matches shared contracts.
- [ ] Confirm client parsing/rendering handles the new types.
- [ ] Keep naming consistent across database columns, API keys, and UI labels.

## Agent guidance

Preferred commands for static inspection and validation:

### Static inspection (fast, no side effects)

- `rg "pattern" server client shared`
- `rg --files server client shared`
- `find server -maxdepth 2 -type d`
- `find client/src -maxdepth 2 -type d`

### Validation

- `npm run check` (TypeScript validation)
- `npm run build` (production build validation)
- `npm run dev:db` (rebuild schema + seed local DB for end-to-end sanity)
- `npm run dev:demo` (demo-mode sanity when DB is unavailable)

When modifying contracts or endpoint shapes, run at least `npm run check` before finalizing.
