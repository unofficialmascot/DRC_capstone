# Demo setup

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
