# Todo App with Categories

Full-stack todo app: NestJS + SQLite backend, Next.js frontend. Turborepo monorepo.

**Live demo:** _add your Vercel URL here_

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Running Locally](#running-locally)
- [Docker Compose](#docker-compose)
- [Running Tests](#running-tests)
- [Environment Variables Reference](#environment-variables-reference)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [AI Usage](#ai-usage)

---

## Features

- Create tasks with text and category
- Mark tasks done (optimistic, 5-second undo, then DELETE)
- Delete tasks (optimistic, 5-second undo)
- Filter list by category
- Bulk select + mark done
- Max 5 active tasks per category (enforced by API)
- Loading / error / empty states

---
## Tech Stack

### Backend
- **Framework:** NestJS 11 + TypeScript
- **Database:** SQLite (better-sqlite3)
- **ORM:** TypeORM
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger (OpenAPI)
- **Tests:** Jest (unit + e2e)

### Frontend
- **Framework:** Next.js 15 + React 19
- **Styling:** TailwindCSS v4
- **Forms:** React Hook Form
- **HTTP:** Axios
- **Notifications:** React Toastify
- **Tests:** Vitest + React Testing Library

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

2. Create `apps/backend/.env` (optional, uses defaults):

   ```
   DATABASE_PATH=./data/db.sqlite
   FRONTEND_URL=http://localhost:3001
   PORT=3000
   NODE_ENV=development
   ```

3. Create `apps/frontend/.env.local`:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. Start both apps:

   ```sh
   pnpm dev
   ```

   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - **Swagger Docs:** http://localhost:3000/api

---
## Docker Compose

Runs full stack with one command. SQLite data persists via named volume.

```sh
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api

Stop containers (preserves data):
```sh
docker compose down
```

Remove data volume:
```sh
docker compose down -v
```

---
## Running Tests

### All Tests (Parallel via Turbo)

```sh
pnpm test
```

### Backend Tests Only

```sh
# Unit tests (test/unit/*.spec.ts)
pnpm test:unit

# E2E tests (test/e2e/*.e2e-spec.ts)
pnpm test:e2e

# Or run from backend dir
cd apps/backend
pnpm test        # unit
pnpm test:e2e    # e2e
pnpm test:cov    # coverage
```

### Frontend Tests Only

```sh
pnpm test:frontend

# Or run from frontend dir
cd apps/frontend
pnpm test
pnpm test:watch
```

**Test Structure:**
```
apps/backend/test/
  unit/           # Service/controller unit tests (Jest)
  e2e/            # API integration tests (Supertest)
apps/frontend/__tests__/
  *.test.tsx      # Component tests (Vitest + RTL)
```

---
## Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable        | Default                  | Description                              |
|-----------------|--------------------------|------------------------------------------|
| `PORT`          | `3000`                   | HTTP port                                |
| `NODE_ENV`      | `development`            | `production` disables TypeORM auto-sync  |
| `DATABASE_PATH` | `./data/db.sqlite`       | Path to SQLite file                      |
| `FRONTEND_URL`  | `http://localhost:3001`  | Allowed CORS origin                      |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Required | Description                |
|-----------------------|----------|----------------------------|
| `NEXT_PUBLIC_API_URL` | Yes      | Base URL of backend API    |

---
## Project Structure

```
uitop-todo-app/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── common/       # Shared: filters, middlewares
│   │   │   ├── config/       # Configuration, Swagger setup
│   │   │   ├── todo/         # Todo module (controller, service, DTOs, entity)
│   │   │   ├── category/     # Category module
│   │   │   └── main.ts       # Bootstrap
│   │   ├── test/
│   │   │   ├── unit/         # Service unit tests
│   │   │   └── e2e/          # API integration tests
│   │   └── package.json
│   └── frontend/             # Next.js app
│       ├── app/              # App Router pages
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks (optimistic removal)
│       ├── lib/              # API client, types
│       ├── __tests__/        # Component tests
│       └── package.json
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---
## API Documentation

### Swagger UI

When backend is running: **http://localhost:3000/api**

Interactive docs with request/response schemas and Try-it-out functionality.

### Endpoints

| Method | Route                 | Body                     | Description                           |
|--------|-----------------------|--------------------------|---------------------------------------|
| `POST` | `/todos`              | `{ text, categoryId }`   | Create task (400 if category full)    |
| `GET`  | `/todos?category={id}`| -                        | List tasks (optional category filter) |
| `DELETE`| `/todos/:id`         | -                        | Delete task (204 on success)          |
| `GET`  | `/categories`         | -                        | List categories                       |

### Example Requests

**Create Task:**
```sh
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"Buy milk","categoryId":1}'
```

**List Tasks (All):**
```sh
curl http://localhost:3000/todos
```

**List Tasks (Filtered by Category 2):**
```sh
curl http://localhost:3000/todos?category=2
```

**Delete Task:**
```sh
curl -X DELETE http://localhost:3000/todos/5
```

---
## Database

### Schema

**SQLite** with TypeORM auto-sync (development only).

**Tables:**

**`category`**
| Column | Type    | Constraints     |
|--------|---------|-----------------|
| id     | INTEGER | PRIMARY KEY     |
| name   | TEXT    | UNIQUE NOT NULL |

**`todo`**
| Column      | Type     | Constraints                           |
|-------------|----------|---------------------------------------|
| id          | INTEGER  | PRIMARY KEY                           |
| text        | TEXT     | NOT NULL                              |
| completed   | BOOLEAN  | DEFAULT false                         |
| categoryId  | INTEGER  | FOREIGN KEY → category(id), NOT NULL  |
| createdAt   | DATETIME | NOT NULL                              |

**Seeded Categories:** Work, Personal, Shopping, Health (on first launch)

### Business Rules

1. **Max 5 active tasks per category** — `POST /todos` returns `400` if limit exceeded (counts only `completed=false`)
2. **Completed tasks are deleted** — frontend shows task for 5 seconds after marking done, then calls `DELETE` (server hard-deletes)
3. **Undo window** — delete/complete actions show toast with Undo button for 5 seconds

### Data Location

- **Local dev:** `apps/backend/data/db.sqlite`
- **Docker:** `/app/data/db.sqlite` (persisted via volume)
- **Railway:** mounted volume path (set via `DATABASE_PATH` env)

---
## Deployment

### Frontend → Vercel

1. Import repo in [Vercel dashboard](https://vercel.com/new)
2. **Root Directory:** `apps/frontend`
3. Add env:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-railway-backend-url>` |

4. Deploy

### Backend → Railway

1. Create Railway project, connect repo
2. **Root Directory:** `apps/backend`
3. Add **Volume** at `/app/data`
4. Add env:

   | Variable | Value |
   |---|---|
   | `DATABASE_PATH` | `/app/data/db.sqlite` |
   | `FRONTEND_URL` | `https://<your-vercel-frontend-url>` |
   | `PORT` | `3000` |
   | `NODE_ENV` | `production` |

5. Deploy (auto-detects Node, runs `npm run start:prod`)

> **Note:** `better-sqlite3` compiles native code during build — Railway provides required tools automatically.

---
## Known Limitations

- Completed tasks are hard-deleted after 5 seconds (no archive/history)
- If browser tab closes during undo window, pending action is lost (client-optimistic trade-off)
- No pagination (acceptable for demo scope)

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

