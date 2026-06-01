# Todo App with Categories

Full-stack todo app: NestJS + SQLite backend, Next.js frontend. Turborepo monorepo.

**Live Demo:**
- **Frontend:** https://uitop-todo-app-frontend.vercel.app
- **Backend API:** https://uitop-todo-app-backend.onrender.com
- **API Docs (Swagger):** https://uitop-todo-app-backend.onrender.com/api

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
   git checkout main
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

| Variable        | Default                 | Description                             |
| --------------- | ----------------------- | --------------------------------------- |
| `PORT`          | `3000`                  | HTTP port                               |
| `NODE_ENV`      | `development`           | `production` disables TypeORM auto-sync |
| `DATABASE_PATH` | `./data/db.sqlite`      | Path to SQLite file                     |
| `FRONTEND_URL`  | `http://localhost:3001` | Allowed CORS origin                     |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Required | Description             |
| --------------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | Base URL of backend API |

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

| Method   | Route                  | Body                   | Description                           |
| -------- | ---------------------- | ---------------------- | ------------------------------------- |
| `POST`   | `/todos`               | `{ text, categoryId }` | Create task (400 if category full)    |
| `GET`    | `/todos?category={id}` | -                      | List tasks (optional category filter) |
| `DELETE` | `/todos/:id`           | -                      | Delete task (204 on success)          |
| `GET`    | `/categories`          | -                      | List categories                       |

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
| Column | Type | Constraints |
|--------|---------|-----------------|
| id | INTEGER | PRIMARY KEY |
| name | TEXT | UNIQUE NOT NULL |

**`todo`**
| Column | Type | Constraints |
|-------------|----------|---------------------------------------|
| id | INTEGER | PRIMARY KEY |
| text | TEXT | NOT NULL |
| completed | BOOLEAN | DEFAULT false |
| categoryId | INTEGER | FOREIGN KEY → category(id), NOT NULL |
| createdAt | DATETIME | NOT NULL |

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

**Live:** https://uitop-todo-app-frontend.vercel.app

1. Import repo in [Vercel dashboard](https://vercel.com/new)
2. **Root Directory:** `apps/frontend`
3. Add env:

   | Variable              | Value                                |
   | --------------------- | ------------------------------------ |
   | `NEXT_PUBLIC_API_URL` | `https://<your-railway-backend-url>` |

4. Deploy

### Backend → Railway/Render

**Live:** https://uitop-todo-app-backend.onrender.com

1. Create Railway project, connect repo
2. **Root Directory:** `apps/backend`
3. Add **Volume** at `/app/data`
4. Add env:

   | Variable        | Value                                |
   | --------------- | ------------------------------------ |
   | `DATABASE_PATH` | `/app/data/db.sqlite`                |
   | `FRONTEND_URL`  | `https://<your-vercel-frontend-url>` |
   | `PORT`          | `3000`                               |
   | `NODE_ENV`      | `production`                         |

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

Yes, absolutely. AI is part of my standard workflow now — I consider it an essential skill, not a nice-to-have.

I use AI throughout the entire development process, but not blindly. My typical workflow is:

1. **Task intake** — I read and understand requirements myself first
2. **Planning** — AI helps brainstorm architecture decisions (for this project, I used the "grill-me" skill to work through endpoints, DB schema, and potential edge cases)
3. **Implementation** — AI + me working together
4. **Code review** — I review manually first, then use AI code-review skills. I find cross-validation between different AI agents most effective (used Codex to double-check Claude Code's output)
5. **Testing**
6. **Commit & delivery**

For every project, I start by setting up `CLAUDE.md` with project-specific skills and conventions.

**What kind of problems or uncertainties did AI help resolve?**

For this project specifically:

**I did manually:**
- Initial project architecture and monorepo setup
- Most of the backend implementation (NestJS controllers, services, DTOs, endpoints) — I already had templates from previous NestJS projects, so AI involvement here was minimal, mostly just adapting specifics to this task

**AI handled heavily:**
- Frontend implementation (React components, styling, layouts, CSS)
- Writing documentation (README, API docs, deployment guides)
- Docker configuration (Dockerfile, docker-compose)
- Deployment setup for Vercel and Render

Basically, AI saved me time on repetitive/boilerplate work and documentation, while I focused on architecture decisions and core business logic.

---

## Note on Requirements Deviation

**Original requirement:**
```
PATCH /todos/:id — update status (completed / not completed)
```

**Why I deviated:**

According to the business logic, completed tasks are automatically deleted after 5 seconds. There's no need to persist a `completed=true` state in the database since completed tasks don't exist long-term.

Instead, I implemented this logic purely on the frontend:
- When user marks a task as done, it's visually marked as completed
- A 5-second undo window is shown
- If no undo happens, the frontend calls `DELETE /todos/:id` to permanently remove it

This approach is cleaner — no need for a PATCH endpoint or a `completed` boolean in the database when the task will be deleted immediately anyway.