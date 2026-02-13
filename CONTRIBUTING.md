# Contributing Guide

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (or accessible Postgres URL)

## First-Time Setup

1. Install dependencies:

```bash
npm ci
```

2. Create environment variables (shell or `.env`):

- `DATABASE_URL`
- `SESSION_SECRET`
- `PORT` (optional, defaults to `5000`)
- `NODE_ENV` (`development` for local work)

3. Apply schema:

```bash
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

## Core Commands

- Typecheck: `npm run check`
- Build: `npm run build`
- Backend tests: `npm run test:backend`

Notes:
- `test:backend` sets test env vars automatically, including a dummy `DATABASE_URL`, so tests run without a live DB connection when storage is mocked.

## Backend Module Layout (Current)

- Route composition: `server/routes.ts`
- Route modules: `server/routes/*.ts`
- Services: `server/services/*.ts`
- Repositories: `server/repositories/*.ts`
- Storage compatibility facade: `server/storage.ts`

### Pattern to Follow

1. Keep HTTP concerns in route modules.
2. Keep orchestration/business rules in services.
3. Keep database access in repositories.
4. Keep cross-route error formatting in `server/routes/http.ts`.

## Testing Guidance

Current backend tests cover:

- Review workflow service: `server/services/review-workflow-service.test.ts`
- HTTP helper utilities: `server/routes/http.test.ts`

When adding backend features:

1. Add or update service-level tests first.
2. Verify with `npm run test:backend`.
3. Run `npm run check` and `npm run build` before opening a PR.

## Pull Request Checklist

- [ ] Scope is focused (no unrelated changes)
- [ ] `npm run test:backend` passes
- [ ] `npm run check` passes
- [ ] `npm run build` passes
- [ ] New behavior is documented if needed
