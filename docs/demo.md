# Demo setup

Run the demo setup script to reset the database, seed demo data, and start the dev server in one command:

```bash
npm run demo:setup
```

What it does:

1. Runs `reset-db.cjs` to reset the database.
2. Runs `run-seed.mjs` to seed demo data.
3. Starts the dev server (`npm run dev`).

Once the dev server is running, open the app as usual in your browser.
Use the demo environment file to spin up a predictable local instance with fixed defaults.

## Quick start

1. Copy the demo environment file:
   ```bash
   cp .env.demo .env
   ```
2. Update `DATABASE_URL` in `.env` to match your local Postgres instance.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

## Demo defaults

The demo environment file ships with:

- `PORT=5000`
- `SESSION_SECRET=demo-session-secret`
- `NODE_ENV=development`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/drc_demo`

Change these values as needed for your local demo environment.
