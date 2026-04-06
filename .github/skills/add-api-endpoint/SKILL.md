---
name: add-api-endpoint
description: "Step-by-step workflow for adding a new typed API endpoint to G-Scholar Hub. Use when: creating new routes, adding new API endpoints, wiring up a new feature end-to-end (schema → route → service → repository → frontend hook → tests)."
argument-hint: "Describe the endpoint (e.g. 'GET /scholars/:id/fees summary for the doaa role')"
---
# Add API Endpoint

End-to-end workflow for adding a new typed endpoint to G-Scholar Hub. Covers every layer: schema → shared contract → repository → service → route → frontend hook → test.

## When to Use

- Adding a new REST endpoint
- Wiring a new feature from DB to UI
- Extending an existing domain with a new operation

## Procedure

### Step 1 — Define the response shape in `shared/schema.ts`

If a new table/column is needed, add it here first. Use `pgTable()` + `createInsertSchema()`:

```ts
export const myThings = pgTable("my_things", {
  id: serial("id").primaryKey(),
  scholarId: text("scholar_id").notNull(),   // logical FK — no .references()
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertMyThingSchema = createInsertSchema(myThings);
export type MyThing = typeof myThings.$inferSelect;
export type InsertMyThing = z.infer<typeof insertMyThingSchema>;
```

Then run `npm run db:push` to apply the schema.

### Step 2 — Add the endpoint contract in `shared/routes.ts`

Add an entry to the `api` object with `method`, `path`, `input` (optional), and `responses`:

```ts
export const api = {
  // ... existing entries
  myThings: {
    list: {
      method: "GET" as const,
      path: "/api/my-things",
      responses: {
        200: z.array(insertMyThingSchema.extend({
          id: z.number(),
          createdAt: z.union([z.string(), z.date(), z.null()]).optional(),
        }).passthrough()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/my-things",
      input: insertMyThingSchema.omit({ id: true }),
      responses: {
        201: insertMyThingSchema.extend({ id: z.number() }).passthrough(),
      },
    },
  },
};
```

Rules:
- Use `.passthrough()` on response schemas — the DB can return extra columns
- Dates in responses: `z.union([z.string(), z.date(), z.null()])`
- Never hardcode the path string in route files — always use `api.<domain>.<endpoint>.path`

### Step 3 — Add the repository method in `server/repositories/<domain>-repository.ts`

```ts
import { db } from "../db";
import { myThings, type MyThing, type InsertMyThing } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class MyThingRepository {
  async list(scholarId: string): Promise<MyThing[]> {
    return db.select().from(myThings)
      .where(eq(myThings.scholarId, scholarId))
      .orderBy(desc(myThings.createdAt));
  }

  async create(data: InsertMyThing): Promise<MyThing> {
    const [row] = await db.insert(myThings).values(data).returning();
    return row;
  }
}
```

### Step 4 — Add business logic in `server/services/<domain>-service.ts`

Keep HTTP concerns out — throw only `badRequest()`, `forbidden()`, `notFound()`:

```ts
import { badRequest, notFound } from "../routes/http";
import { MyThingRepository } from "../repositories/my-thing-repository";

const repo = new MyThingRepository();

export async function listMyThings(scholarId: string) {
  // business rules, validation, cross-entity lookups
  return repo.list(scholarId);
}
```

### Step 5 — Register the route in `server/routes/<domain>-routes.ts`

```ts
import type { Express } from "express";
import { api } from "@shared/routes";
import { badRequest, handleRouteError, notFound, unauthorized } from "./http";
import { listMyThings } from "../services/my-thing-service";

export function registerMyThingRoutes(app: Express): void {
  app.get(api.myThings.list.path, async (req, res) => {
    try {
      if (!req.session.userId) throw unauthorized("Not authenticated");
      const result = await listMyThings(req.query.scholarId as string);
      res.json(result);
    } catch (error) {
      return handleRouteError(res, error);
    }
  });
}
```

Then import and call `registerMyThingRoutes(app)` in `server/routes.ts`.

### Step 6 — Add a frontend hook in `client/src/hooks/use-my-things.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useMyThings(scholarId: string) {
  return useQuery({
    queryKey: [api.myThings.list.path, scholarId],
    queryFn: async () => {
      const res = await fetch(`${api.myThings.list.path}?scholarId=${scholarId}`, {
        credentials: "include",
      });
      return api.myThings.list.responses[200].parse(await res.json());
    },
  });
}
```

### Step 7 — Write a service test in `server/services/<domain>-service.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { listMyThings } from "./my-thing-service";
import { MyThingRepository } from "../repositories/my-thing-repository";

function withMockedRepositoryPrototype(
  overrides: Partial<MyThingRepository>,
  run: () => Promise<void>,
) {
  const originals: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(overrides)) {
    originals[k] = (MyThingRepository.prototype as unknown as Record<string, unknown>)[k];
    (MyThingRepository.prototype as unknown as Record<string, unknown>)[k] = v;
  }
  return run().finally(() => {
    for (const [k, v] of Object.entries(originals)) {
      (MyThingRepository.prototype as unknown as Record<string, unknown>)[k] = v;
    }
  });
}

test("listMyThings returns items for scholar", async () => {
  const fakeItems = [{ id: 1, scholarId: "S001", value: "foo", createdAt: null }];
  await withMockedRepositoryPrototype(
    { list: async () => fakeItems },
    async () => {
      const result = await listMyThings("S001");
      assert.deepEqual(result, fakeItems);
    },
  );
});
```

### Step 8 — Verify

```bash
npm run check          # TypeScript typecheck
npm run test:backend   # All backend tests
```
