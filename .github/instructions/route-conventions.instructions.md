---
description: "Use when writing, editing, or reviewing Express route handlers in server/routes/. Enforces handleRouteError, http.ts error helpers, parsePositiveIntParam, session auth, and the api object path contract."
applyTo: "server/routes/**"
---
# Route Handler Conventions

## Required structure for every handler

```ts
import { api } from "@shared/routes";
import { badRequest, forbidden, handleRouteError, notFound, unauthorized, parsePositiveIntParam } from "./http";

export function registerXxxRoutes(app: Express): void {
  app.get(api.xxx.yyy.path, async (req, res) => {
    try {
      // ... logic
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);   // ← REQUIRED in every catch block
    }
  });
}
```

## Rules

- **Never** use `new Error()` in route or service code — always use `badRequest()`, `notFound()`, `unauthorized()`, or `forbidden()` from `./http`.
- **Always** call `handleRouteError(res, error)` in every `catch` block — it dispatches `ApiError`, `ZodError`, and generic errors differently.
- **Always** register paths via `api.<domain>.<endpoint>.path` — never hardcode URL strings.
- **Always** export a `register<Domain>Routes(app: Express): void` function and import it in `server/routes.ts`.

## Integer route params

Use `parsePositiveIntParam` for any `:id` or similar param — it rejects `0`, floats, and `Infinity` and sends a 400 automatically:

```ts
const id = parsePositiveIntParam(req.params.id, res);
if (id === null) return;   // response already sent
```

## Auth checks

```ts
if (!req.session.userId) throw unauthorized("Not authenticated");
const sessionUser = await storage.getUserWithScholar(req.session.userId);
if (!sessionUser) throw notFound("User not found");
```

Strip passwords before sending any user object: `const { password: _, ...safeUser } = sessionUser`.

## Role checks

```ts
if (sessionUser.role !== "drc_convener") throw forbidden("DRC convener only");
// or for multi-role employees:
const hasRole = await storage.userHasAnyRole(sessionUser.id, ["drc", "drc_convener"]);
if (!hasRole) throw forbidden("Insufficient role");
```

## Response validation

Parse outgoing data against the `shared/routes.ts` schema before responding when the schema is non-trivial:

```ts
const parsed = api.xxx.yyy.responses[200].parse(rawResult);
res.json(parsed);
```
