# CLAUDE.md

**Architecture, commands, and behavioral rules for this project.**

See [README.md](README.md) for detailed project documentation.

---

## Critical: Load Behavioral Guidelines First

**Before performing ANY task in a new session:**

```
/karpathy-guidelines
```

Load and STRICTLY follow the 4 core principles from that skill:
1. Think Before Coding
2. Simplicity First
3. Surgical Changes
4. Goal-Driven Execution

These principles are MANDATORY. Non-negotiable. Apply them to every code change, review, or refactor.

---

## Project Overview

Todo app with categories. Turborepo monorepo.

- **Backend:** NestJS + SQLite + TypeORM + Jest
- **Frontend:** Next.js 15 + React Hook Form + Axios + TailwindCSS + React Toastify + Vitest + RTL
- **Deploy:** Frontend → Vercel, Backend → Railway/Render

### Business Rules

- Max **5 active tasks per category** → API returns `400` if exceeded
- Complete/delete shows toast with **Undo** (5-second window, then commits)
- Filter by category ("All" = no filter)

---

## Commands

Run from repo root:

| Command              | Purpose                              |
|----------------------|--------------------------------------|
| `pnpm dev`           | Start backend + frontend             |
| `pnpm build`         | Build all apps                       |
| `pnpm test`          | Run all tests (parallel via Turbo)   |
| `pnpm test:unit`     | Backend unit tests only              |
| `pnpm test:e2e`      | Backend e2e tests only               |
| `pnpm test:frontend` | Frontend tests only                  |

**Docker:**
```sh
docker compose up --build
```

---

## Skill Routing

**ALWAYS load the appropriate skill BEFORE working in these areas:**

| Area / File Pattern          | Skills to Load                                                         |
|------------------------------|------------------------------------------------------------------------|
| `apps/backend/` (NestJS API) | `nestjs-patterns`, `nestjs-expert`, `sqlite-expert`                    |
| `apps/frontend/` (Next.js)   | `nextjs-app-router-patterns`, `nextjs-best-practices`, `react-hook-form`, `tailwindcss` |
| Backend tests                | `jest`                                                                 |
| Frontend tests               | `react-testing`                                                        |
| Docker / Compose             | `docker-patterns`                                                      |

**Skills compose:** Frontend form hitting API → load frontend + backend skills together.

---

## API Contract

| Method | Route               | Body                   | Returns                          |
|--------|---------------------|------------------------|----------------------------------|
| POST   | `/todos`            | `{ text, categoryId }` | Created todo or `400` if full    |
| GET    | `/todos?category=`  | -                      | Array of todos (optional filter) |
| DELETE | `/todos/:id`        | -                      | `204` on success                 |
| GET    | `/categories`       | -                      | Array of categories              |

Swagger docs when backend running: **http://localhost:3000/api**

---

## Required UX States

- Loading spinner
- Error message
- Empty state ("No tasks")
