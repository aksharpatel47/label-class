# Repository Guidelines

## Project Structure & Module Organization

Primary Next.js app lives under `src/app`, with `(app)` and `(auth)` route groups covering authenticated dashboards and sign-in surfaces, and `api/` handlers co-located per feature. Shared UI and form elements belong in `src/components`, while reusable hooks stay in `src/hooks` and request utilities in `src/lib`. Database schema, migrations, and the Drizzle client are centralized in `src/db`. Static assets belong in `public`, and dataset processing scripts live in `datasets` alongside import helpers and backup exports.

## Build, Test, and Development Commands

- `bun run dev` starts the Turbopack-powered development server at `http://localhost:3000`.
- `bun run build` produces an optimized Next.js bundle; run before release reviews.
- `bun run start` serves the production build; useful for smoke tests.
- `bun run lint` runs ESLint across `src` to ensure style parity.
- `bun run studio` opens the Drizzle Studio UI after the database is up via `docker compose -f docker-compose-dev.yml up`.
- `bun run migrate:create` scaffolds SQL migrations, and `bun run migrate:apply` applies them to the configured database.

## Coding Style & Naming Conventions

Use TypeScript throughout; components and hooks should ship typed props and responses. Prettier defaults (two-space indentation, semicolons, double quotes) plus ESLint rules from `eslint-config-next` are authoritative—run `bun run lint` before pushing. React components stay PascalCase (`LabelFilter.tsx`), hooks use the `use*` prefix, shared utilities prefer camelCase, and Drizzle tables or relations live in `schema.ts` with snake_case column names to match Postgres. Tailwind utility classes should remain grouped by layout → spacing → color to keep diffs readable.

## Testing Guidelines

Automated tests are not yet implemented; contributions should add coverage alongside new features. Prefer React Testing Library for UI and Bun tests for logic, grouping files as `*.test.ts(x)` next to the code they exercise. Run `bun run build` and any added test scripts locally; update `bun run test:ci` once suites are introduced.

## Commit & Pull Request Guidelines

Follow the conventional commit prefixing seen in history (`fix:`, `refactor:`, `feat:`) so changelogs remain machine-readable. Scope each PR around a single theme, describe the user impact, and link GitHub issues when available. Include screenshots or short videos for UI changes, list any schema migrations, and confirm `bun run lint` + `bun run build` in the PR checklist.

## Data & Environment Notes

Local development expects a Postgres instance; use the provided Docker Compose profile and refresh `.env` secrets before running migrations. Large image datasets under `datasets/` are read-only references—avoid committing new raw assets; instead store scripts or signed download links in that directory.
