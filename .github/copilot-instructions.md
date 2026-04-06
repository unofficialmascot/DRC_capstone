# G-Scholar Hub — Copilot Instructions

G-Scholar Hub is a research scholar lifecycle management system for GITAM University's Doctoral Research Committee (DRC). It handles application workflows, DRC meetings, supervisor assignments, and multi-role dashboards.

## Build & Test

```bash
npm ci                   # install dependencies
npm run dev              # dev server (Express + Vite HMR on :5000)
npm run check            # TypeScript typecheck
npm run test:backend     # backend unit tests (no live DB required)
npm run build            # production build
npm run db:push          # apply schema to DB (TLS bypass for local dev)
```

Always run `npm run check` and `npm run test:backend` before opening a PR. See [CONTRIBUTING.md](../CONTRIBUTING.md) for full setup instructions and the PR checklist.

## Architecture

Three-tier backend layered strictly: routes → services → repositories.

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Route modules | `server/routes/*.ts` | HTTP parsing, auth checks, `req.session.userId` |
| Services | `server/services/*.ts` | Business logic, workflow orchestration |
| Repositories | `server/repositories/*.ts` | All database access via Drizzle ORM |
| Storage facade | `server/storage.ts` | Compatibility shim — prefer repositories for new code |

**Shared contract** (`shared/`): `schema.ts` is the single source of truth for DB schema and Zod types; `routes.ts` defines typed API contracts (paths, methods, input/output Zod schemas) used by both server and client.

Frontend is React + Vite + Wouter + TanStack Query + Tailwind CSS. Role-based dashboards are under `client/src/pages/`.

## Key Conventions

### API Contracts
Always use the `api` object from `shared/routes.ts` — on the server to register paths, on the client to fetch and parse responses:
```ts
// server
app.get(api.applications.list.path, async (req, res) => { … })

// client
const res = await fetch(api.applications.list.path, { credentials: "include" });
return api.applications.list.responses[200].parse(await res.json());
```

### Backend Error Handling
Throw errors using helpers from `server/routes/http.ts`. Never construct raw `Error` objects in routes or services:
```ts
throw notFound("Application not found");
throw unauthorized("Not authenticated");
throw badRequest("Invalid stage");
throw forbidden("Not assigned to this scholar");
```

### Auth & Session
- Authenticate via `req.session.userId` (set at login)
- Fetch the full user with `await storage.getUserWithScholar(req.session.userId)`
- Strip passwords before responding: `const { password: _, ...rest } = user`
- Employees can hold multiple roles via `employeeRoles` table; use `storage.userHasAnyRole()` to check

### Database / Schema
- Schema changes: edit `shared/schema.ts`, then run `npm run db:push` (dev) or add a new migration in `migrations/`
- Use Drizzle query builder directly in repository classes; import `db` from `server/db`
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`

### Frontend Data Fetching
- All server calls go through TanStack Query hooks in `client/src/hooks/`
- Use `apiRequest()` from `client/src/lib/queryClient.ts` (handles error parsing into `ApiClientError`)
- Validate query/mutation responses with the corresponding `api.*.responses[status].parse(…)` schemas

### User Roles
Roles: `scholar`, `supervisor`, `drc`, `drc_convener`, `drc_chairman`, `irc`, `doaa`, `admin`.  
Employees can have additional roles stored in `employeeRoles` and exposed as `availableRoles` on the session user.

### Notifications
`emitRoleNotification()` in `notification-service.ts` is skipped in `NODE_ENV=test` — do not add workarounds for this in tests.

## Existing Documentation

- Setup & module layout: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Schema history: [SCHEMA_NORMALIZATION.md](../docs/SCHEMA_NORMALIZATION.md), [SCHEMA_UPDATE_SUMMARY.md](../docs/SCHEMA_UPDATE_SUMMARY.md)
- Migration log: [MIGRATION_SUMMARY.md](../docs/MIGRATION_SUMMARY.md)
- DRC convener test checklist: [DRC_CONVENER_MEETINGS_TEST_CHECKLIST.md](../docs/DRC_CONVENER_MEETINGS_TEST_CHECKLIST.md)
