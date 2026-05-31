# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 0. Project Context

Todo app with categories. Turborepo monorepo.

- `apps/backend` — NestJS + SQLite; tests: **Jest**
- `apps/frontend` — Next.js + TypeScript + React Hook Form + Axios + TailwindCSS + React Toastify; tests: **React Testing Library**
- Deploy: frontend → Vercel, backend → Render/Railway

### In-scope bonus

- **Bulk action**: select all / multiple tasks and mark them as done.

### Business rules

- Max **5 tasks per category** → `POST /todos` returns `400 Bad Request` if exceeded.
- Completing or deleting a task shows a toast with an **Undo** button; the action commits after ~5 seconds if Undo is not clicked.
- List can be filtered by category ("All" = no filter).

### API contract

| Method | Route | Purpose |
|--------|-------|---------|
| POST   | `/todos`            | create `{ text, categoryId }` |
| GET    | `/todos?category=`  | list (optional category filter) |
| PATCH  | `/todos/:id`        | toggle completed status |
| DELETE | `/todos/:id`        | delete a todo |
| GET    | `/categories`       | list categories |

### Required UX states

Loading spinner · error message · empty state ("No tasks").

### Commands

Fill in after scaffolding is verified — do not guess Turborepo scripts.

- dev: _TBD_
- test: _TBD_
- build: _TBD_

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Skill Routing

Load the matching skill before working in these areas:

- **`apps/backend/`** (NestJS API) → `nestjs-patterns`, `nestjs-expert`, `sqlite-expert`
- **`apps/frontend/`** (Next.js app) → `nextjs-app-router-patterns`, `nextjs-best-practices`, `react-hook-form`, `tailwindcss`
- **Tests** → `jest` (backend, unit/e2e), `react-testing` (frontend components)
- **Docker / Compose** → `docker-patterns`

Skills compose — a frontend form touching the API loads frontend + backend skills together.
