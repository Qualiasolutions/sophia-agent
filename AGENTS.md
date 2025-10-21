# Repository Guidelines

SophiaAI is a turborepo powering Qualia’s real-estate assistant across web and messaging surfaces. Follow these practices to keep every agent stable.

## Project Structure & Module Organization
- `apps/web` hosts the Next.js 15 admin dashboard (App Router) with UI under `src/app` and primitives in `src/components`.
- `packages/services` contains AI agent services (OpenAI, Telegram, WhatsApp, calculators) with colocated `__tests__`.
- `packages/shared` provides shared types and utilities consumed by the web app and services.
- `packages/database/supabase` stores migrations and seeds; validate with the Supabase CLI before shipping.
- `docs` holds architecture notes, product requirements, and channel setup playbooks—update when flows change.

## Build, Test, and Development Commands
- `npm run dev` (root) starts workspace dev targets via Turbo; use `npx turbo run dev --filter web` to isolate the dashboard.
- `npm run build` compiles every workspace for production and must pass before merging.
- `npm run lint` (in `apps/web`) runs ESLint with the Next.js core-web-vitals rules.
- `npm run test` executes Vitest across workspaces; add `--watch` locally for fast feedback.

## Coding Style & Naming Conventions
TypeScript is required across packages. Use two-space indentation, prefer named exports, and keep React components as PascalCase (e.g., `ActivityFeed`). Route segments follow kebab-case folders under `src/app`. Tailwind CSS 4 powers styling—co-locate utility classes within JSX. ESLint and TypeScript strict mode are the source of truth; run linting before pushing.

## Testing Guidelines
Vitest plus Testing Library drive component and API coverage. Place component tests in `src/components/**/__tests__` and endpoint tests beside the route handler (`apps/web/src/app/api/.../__tests__`). Service tests live in `packages/services/src/__tests__`. Cover new execution paths and mock external APIs (Supabase, OpenAI, messaging gateways). Use `vitest --ui` for complex suites.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`type(scope): summary`) consistent with entries like `fix(whatsapp): remove unused businessAccountId property`. Pull requests must describe the change, list impacted services or flows, note environment variable updates, and include screenshots or curl samples for UI/API changes. Link Jira tickets or GitHub issues and confirm `npm run build` and `npm run test` have run locally.

## Agent Integration Notes
Environment configuration lives in `.env.example`; duplicate keys for local overrides only. When adding a new channel, route secrets through env vars, expose service wrappers in `packages/services`, and wire UI entry points under `apps/web/src/app/(agents)` to keep telemetry consistent.
