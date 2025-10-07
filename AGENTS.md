# Repository Guidelines

## Project Structure & Module Organization
Turbo and npm workspaces manage the repo defined in `package.json`. The Next.js app sits in `apps/web`; core UI lives in `src/components`, routes and handlers in `src/app`, and assets in `public`. Shared types and utilities ship from `packages/shared/src`, while external service clients (Supabase, OpenAI, messaging) live in `packages/services/src`. Database schemas and SQL helpers reside in `packages/database`. Long-form playbooks for agents and ops live in `docs/` and `Knowledge Base/`.

## Build, Test, and Development Commands
Install once with `npm install`. `npm run dev` fans out through Turbo to `next dev --turbopack` and any package-level dev scripts. `npm run build` runs workspace builds and checks the env keys listed in `turbo.json`. `npm run test` executes every registered Vitest target. For scoped work, use `npm --workspace apps/web run lint`, `npm --workspace apps/web run test`, `npm --workspace apps/web run test:watch`, or `npm --workspace packages/services run test`.

## Coding Style & Naming Conventions
ESLint flat config (`apps/web/eslint.config.mjs`) extends `next/core-web-vitals`, so fix accessibility warnings and unused exports before committing. Stick to 2-space indentation, PascalCase components, camelCase helpers, and SCREAMING_SNAKE_CASE env constants. Keep Tailwind classes inline, colocate small styles with their component, and re-export shared helpers from `packages/shared/src/index.ts`. Align quote style with the surrounding file (Next.js defaults to double quotes in app code).

## Testing Guidelines
Vitest underpins unit and integration coverage: UI and API tests live in `apps/web/src/**/__tests__` using the JSDOM environment, while Node-based suites in `packages/services` validate adapters. Name files `*.test.ts` or `*.test.tsx`. When altering API handlers, messaging bridges, or auth helpers, add both success and failure assertions. Run `npm --workspace apps/web run test` before pushing; add `--coverage` when touching critical paths or debugging regressions.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style (`fix:`, `chore:`, `docs:`, `debug:`) with imperative, sub-72 character subjects. Summarize intent and risk in the PR description, link the tracking ticket, and include screenshots or command output when behavior changes. Call out new env vars, migrations, or manual follow-ups so deployment and agent operators can prepare.

## Security & Configuration Tips
Populate secrets via `.env.local` (root or workspace). Start from `.env.example` or `apps/web/.env.example`, and avoid committing populated `.env*` files. Reserve Supabase service-role keys for server-only contexts, and use the lightweight values in `apps/web/.env.verify` when running webhook or diagnostic scripts locally.
