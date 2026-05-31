# Todo App with Categories

Full-stack todo app: NestJS + SQLite backend, Next.js frontend. Turborepo monorepo.

**Live demo:** _add your Vercel URL here_
**API:** _add your Railway URL here_

---

## Features

- Create tasks with text and category
- Mark tasks done (optimistic, 5-second undo)
- Delete tasks (optimistic, 5-second undo)
- Filter list by category
- Bulk select + mark done
- Max 5 active tasks per category (enforced by API)
- Loading / error / empty states

---

## Running Locally

### Prerequisites

- Node.js ≥ 18
- pnpm 9 (`npm install -g pnpm@9`)

### Setup

1. Clone and install:

   ```sh
   git clone <repo-url>
   cd uitop-todo-app
   pnpm install
   ```

2. Create `apps/backend/.env` (copy from `.env.example`):

   ```
   DATABASE_PATH=./data/db.sqlite
   FRONTEND_URL=http://localhost:3001
   PORT=3000
   ```

3. Create `apps/frontend/.env.local` (copy from `.env.local.example`):

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. Start both apps:

   ```sh
   pnpm dev
   ```

   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

### Running Tests

```sh
# Backend (Jest)
pnpm --filter backend test
pnpm --filter backend test:e2e

# Frontend (Vitest + RTL)
pnpm --filter frontend test
```

---

## Docker Compose

Runs the full stack with one command. SQLite data persists across restarts via a named volume.

```sh
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

To stop and remove containers (data volume is preserved):

```sh
docker compose down
```

To also remove the data volume:

```sh
docker compose down -v
```

---

## Deployment

### Frontend → Vercel

1. Import the repo in the [Vercel dashboard](https://vercel.com/new).
2. Set **Root Directory** to `apps/frontend`.
3. Add environment variable:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-railway-backend-url>` |

4. Deploy.

### Backend → Railway

1. Create a new Railway project and connect the repo.
2. Set **Root Directory** to `apps/backend`.
3. Add a **Volume** mounted at `/app/data`.
4. Add environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_PATH` | `/app/data/db.sqlite` |
   | `FRONTEND_URL` | `https://<your-vercel-frontend-url>` |
   | `PORT` | `3000` |

5. Deploy. Railway auto-detects Node and runs `npm run start:prod` (or set the start command to `node dist/main`).

> **Note:** The `better-sqlite3` native module compiles during build. Railway provides the required build tools automatically.

### Known Limitations

- Completed tasks accumulate in the database over time and are never purged. This is acceptable for this scope.
- If the browser tab is closed during the 5-second undo window, the pending action is lost (accepted trade-off of the client-optimistic approach).

---

## Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `./data/db.sqlite` | Path to the SQLite file |
| `FRONTEND_URL` | `http://localhost:3001` | Allowed CORS origin |
| `PORT` | `3000` | HTTP port |

### Frontend (`apps/frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API |

---

## AI Usage

**Did you use AI at any stage while working on this task? Why?**

Yes. I used Claude Code (Anthropic's CLI agent) throughout the entire build. The rationale: this task spans a full stack with several intersecting constraints (NestJS + TypeORM + better-sqlite3, Next.js App Router + React Hook Form + Toastify, optimistic-undo timer logic, RTL + Vitest test setup, Docker multi-stage with native modules). Using AI let me move faster on the mechanical parts (boilerplate, wiring, Docker config) and focus attention on the behavioral logic that actually carries risk (the undo timer race, the 5-task limit, CORS/env wiring for deployment).

**What kind of problems or uncertainties did AI help resolve?**

- **Architectural decisions:** resolving 11 ambiguous forks in the spec before writing any code (e.g., client-optimistic vs server soft-delete, where to count the 5-task limit, how to handle completed rows in the limit check).
- **Native module Docker build:** `better-sqlite3` requires `python3 make g++` at compile time but not at runtime — AI identified this as risk R-A early and prescribed the multi-stage Dockerfile pattern with `libstdc++` in the production stage.
- **Timer/Undo race conditions:** the `useOptimisticRemoval` hook is the highest-risk logic (rapid double-actions, unmount cleanup). AI prescribed test-first execution for that unit specifically.
- **Tooling conflicts:** Next.js 16 + React 19 with RTL required Vitest + jsdom rather than the classic Jest+jsdom path — AI flagged this compatibility gap during dependency planning.
- **Monorepo Docker wiring:** getting pnpm workspace deps to resolve correctly inside a Docker build context (copy `packages/` before `pnpm install --filter`).
