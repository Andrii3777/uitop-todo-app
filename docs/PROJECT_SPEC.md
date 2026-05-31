# Project Spec — Todo with Categories

Full-stack test task (UITOP). Single source of truth for scope and decisions. Derived from `task.md` + grilling session. Feeds `/ce-plan`.

## 1. Overview

Small full-stack app to manage tasks (todos) grouped by category. Turborepo monorepo.

- `apps/backend` — NestJS + SQLite (TypeORM). Tests: Jest.
- `apps/frontend` — Next.js 16 (App Router) + TypeScript + React Hook Form + Axios + TailwindCSS + React Toastify. Tests: React Testing Library.
- Deploy: frontend → Vercel, backend → Railway (with volume).

## 2. Features (from task.md)

1. Create task with text + category.
2. View list of tasks (text + category + done/not-done).
3. Mark task done via checkbox.
4. Delete a task.
5. Filter list by category ("All" = no filter).
6. Max **5 tasks per category** → `POST` returns `400`.
7. Complete/delete → toast with **Undo**, 5s window, then commit.
8. UX states: loading spinner / error message / empty "No tasks".

### Bonuses (in scope)

- Jest tests (backend), React Testing Library tests (frontend).
- `docker-compose` for local run (final slice, cut first if time-constrained).
- **Bulk action**: select multiple/all tasks, mark done.

## 3. Locked Decisions (grilling output)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Undo mechanics | **Client-optimistic** — no server soft-delete | Spec is UX-driven; matches the 5 fixed endpoints; least code |
| 2 | "Completed" in list | Transient 5s flow; frontend shows only `completed=false`; `GET` returns all | Detailed lines 23-28 are the explicit feature; one reusable transient pattern for complete + delete |
| 3 | 5-limit counts | **Active only** (`completed=false`) | Completed tasks are hidden; blocking against invisible rows is bad UX |
| 4 | DB layer | **TypeORM** `synchronize:true`, `better-sqlite3` driver | Idiomatic NestJS (repositories/DI/entities); no migration overhead for this scope |
| 5 | Categories | **Seed** 3-5, idempotent, no `POST /categories` | task.md only lists `GET /categories`; select implies fixed set |
| 6 | Bulk action | **One batch toast + one Undo**; loop `PATCH` after 5s | Clean UX, reuses optimistic hook, stays within 5 endpoints |
| 7 | Shared types | **Local `types.ts`** on frontend, no shared package | 2-3 interfaces; avoids cross-builder build wiring |
| 8 | Frontend fetch | **Fully client-side Axios** | Axios mandated; whole UI interactive; no SSR benefit |
| 9 | Backend host + DB | **Railway + volume**, `DATABASE_PATH` env | SQLite file persists across redeploys (avoids "data gone" on restart) |
| 10 | docker-compose | In scope, final slice | Explicit bonus; cut first if time-constrained |
| 11 | Category filter | By **`categoryId`**; "All" = param omitted | Single key across API; no name-collision ambiguity |

### Fixed defaults

- Validation: `class-validator` + global `ValidationPipe`. Non-existent category → `400`.
- Toasts: react-toastify, `autoClose=5000`, Undo button inside the toast; commit on close/timeout.
- States: loading = spinner; error = toast + inline message; empty = "No tasks" + icon.
- Ports: backend `3000` (Nest default), frontend `3001`.
- 5-limit `400`: clear `message`, surfaced on frontend via toast.

## 4. Data Model

```
Category {
  id:   number (PK)
  name: string (unique)
}

Todo {
  id:        number (PK)
  text:      string         // @IsString @IsNotEmpty @MaxLength(200)
  completed: boolean        // default false
  category:  Category       // ManyToOne, categoryId FK
  createdAt: Date
}
```

Seed categories (idempotent, only if table empty): Work, Personal, Shopping, Health.

## 5. API Contract

| Method | Route | Body / Query | Behavior |
|--------|-------|--------------|----------|
| POST   | `/todos`           | `{ text, categoryId }` | Create. `400` if category active count >= 5, or category missing, or invalid body |
| GET    | `/todos`           | `?category=<id>` (optional) | List todos; filter by categoryId if present |
| PATCH  | `/todos/:id`       | `{ completed: boolean }` | Toggle completed status. `404` if not found |
| DELETE | `/todos/:id`       | — | Hard delete. `404` if not found |
| GET    | `/categories`      | — | List seeded categories |

CORS: backend allows origin from `FRONTEND_URL` env. Frontend calls backend via `NEXT_PUBLIC_API_URL`.

> **`.env` rule:** the agent never writes `.env` files. When one is needed, it proposes contents in chat and the user creates the file. `.env.example` templates may be written directly.

## 6. Frontend Behavior

- Root page `'use client'`. Initial `GET /todos` + `GET /categories` via Axios on mount.
- Active list renders only `completed=false` todos.
- **Create form** (React Hook Form): text input + category select → `POST /todos`. On `400` (limit/validation) show error toast/inline.
- **Complete / delete (optimistic + Undo)**: remove from visible state immediately, start 5s timer, show Undo toast.
  - Undo → cancel timer, restore item, no network call.
  - Timeout/close → fire `PATCH` (complete) or `DELETE`.
- **Bulk action**: select multiple/all → "Mark done" → optimistic remove all, single Undo toast, after 5s loop `PATCH /todos/:id`.
- **Filter**: category select above list; selected → `GET /todos?category=<id>`; "All" → no param.
- States: spinner while loading; inline error message + toast on failure; "No tasks" empty state.

## 7. Implementation Slices (plan input)

Each slice = full work → review → compound loop.

1. **Scaffold + shared** — install deps; TypeORM + SQLite wiring; `Category`/`Todo` entities; seed categories; frontend Tailwind/RHF/Axios/Toastify setup; frontend `types.ts`. Verify: backend boots, `GET /categories` returns seed.
2. **Backend API** — all 5 endpoints + DTO validation + 5-limit `400` + Jest unit/e2e. Verify: tests green.
3. **Frontend core** — list page, create form (RHF), category select, Axios client, loading/error/empty. Verify: create + list against real backend.
4. **Undo + filter + bulk** — optimistic complete/delete with Toastify Undo (5s), category filter, bulk mark-done; RTL tests. Verify: undo restores, filter narrows, bulk works.
5. **Polish + deploy** — docker-compose, README (run + deploy + AI Q&A), Vercel + Railway deploy, env wiring. Verify: live links work.

## 8. Out of Scope

- Auth / users.
- Category CRUD (create/edit/delete categories).
- Server-side undo / soft-delete / audit history.
- Pagination, search.
- Shared types package.
