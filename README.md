# DRC Capstone

## Local dev database
Use the local dev flow when you want a clean schema plus demo data. It will **drop and recreate the public schema**, recreate tables from the Drizzle schema, and then seed demo users/data.

```bash
npm run dev:db
```

## Local demo data (no database)
If you want to run the app without connecting to Postgres, use the file-backed demo store. Data lives in `server/data/demo-data.json`, so you can edit the JSON directly and restart the server.

```bash
npm run dev:demo
```

You can also point to a different data file by setting `DEMO_DATA_FILE=/path/to/your.json`.

### Reset/seed helpers (`scripts/db`)
- `scripts/db/reset-schema.cjs`: drops/recreates the public schema (use with `dev:db`).
- `scripts/db/reset-db.cjs`: clears demo data without dropping the schema.
- `scripts/db/reset-seed.cjs`: clears demo data (variant used for reseeding workflows).
- `scripts/db/run-seed.mjs`: inserts demo accounts and sample records.

### Migrations vs. demo data
- **Production/staging**: apply schema changes via migrations only (see `scripts/migrations/apply-migrations.cjs`), and avoid demo reseeds.
- **Local dev/demo**: use `npm run dev:db` to rebuild schema and load demo data quickly.

## Demo data (seeded)
Use the following demo IDs (all with password `password123`) to log in and show specific flows.

### Scholars
- `GITAM-SCH-2020-118` — Thirupathi Kumar (Extension request on file; pending at supervisor stage, submitted 2025-01-15).
- `GITAM-SCH-2021-204` — Priya Reddy (Research progress seeded with 2 completed reviews).
- `GITAM-SCH-2019-087` — Arvind Kumar Singh (PWD, eligible for extension rules).
- `GITAM-SCH-2023-156` — Neha Sharma (not eligible; early phase).
- `GITAM-SCH-2020-142` — Ravi Malhotra (not eligible; fee arrears).
- `GITAM-SCH-2021-098` — Meera Gupta (PWD, eligible).

### Reviewers/Staff
- `EMP-SUPERVISOR-001` — Dr. Ramesh Kumar (Supervisor).
- `EMP-DRC-001` — Dr. Lakshmi Narayana (DRC member).
- `EMP-IRC-001` — Dr. Venkatesh Rao (IRC member).
- `EMP-DOAA-001` — Prof. Srinivas Reddy (DoAA).

### Sample records
- Extension application: Thirupathi Kumar (`GITAM-SCH-2020-118`) with a fixed submission date (2025-01-15) and timeline details for demo walkthroughs.
- Research progress: Thirupathi Kumar (4 completed reviews) and Priya Reddy (2 completed reviews) with fixed review dates to demonstrate reporting views.
