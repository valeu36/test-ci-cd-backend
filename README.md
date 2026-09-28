# test-ci-cd-backend

NestJS 11 + TypeORM + Postgres API. Pairs with
[`test-ci-cd-frontend`](../test-ci-cd-frontend). CI on GitHub Actions, CD via
Railway's GitHub integration.

## Local setup

```bash
nvm use                       # Node per .nvmrc — under the shell's default v20 failures look like broken deps
npm ci
cp .env.example .env.development
npm run docker:dev:up         # Postgres on :5432
npm run migration:run:dev
npm run start:dev             # http://localhost:3000/api/v1/health, Swagger at /api/docs
```

## Scripts

| Script                                                          | What it does                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `lint` / `format:check` / `typecheck`                           | The three static gates CI runs — prettier is separate from ESLint                                              |
| `test`                                                          | Jest unit tests (`src/**/*.spec.ts`)                                                                           |
| `env:testing`                                                   | Writes `.env.testing` if missing — the only writer of that file                                                |
| `docker:test:up`                                                | Disposable Postgres on :5433 (tmpfs), waits until healthy                                                      |
| `test:e2e`                                                      | Jest e2e (`test/**/*.e2e.spec.ts`) against that Postgres — needs `docker:test:up` + `migration:run:test` first |
| `e2e:serve`                                                     | All of the above, then serves the API — what the frontend Playwright suite boots                               |
| `migration:generate` / `migration:run:*` / `migration:revert:*` | TypeORM migrations. `:prod` runs from `dist/` and is Railway's pre-deploy command                              |
| `openapi:generate` / `openapi:check`                            | Write `openapi.json` (no DB needed) / fail if the committed copy is stale                                      |
| `railway:plan` / `railway:apply`                                | Preview / apply `.railway/railway.ts` to the Railway project                                                   |

## API contract (`openapi.json`)

`openapi.json` is generated from the controllers' decorators and committed. The
frontend generates its typed client and TanStack Query hooks from a copy of it
(`npm run api:generate` there). After changing an endpoint: run
`npm run openapi:generate`, commit the file, then regenerate the frontend
client on the paired branch.

Errors from every endpoint share one envelope
(`src/common/filters/all-exceptions.filter.ts`):
`{ statusCode, error, message, path, timestamp }`, plus whatever body the
exception carried.

## CI (`.github/workflows/ci.yml`)

`checks` (lint, format, typecheck, `openapi:check`, unit, build ×2 + `dist/` layout assertion),
`e2e` (real Postgres), `frontend-e2e` (the frontend's Playwright suite against
this branch), and one aggregate `CI` job — the only check branch protection
needs to require.

`frontend-e2e` picks the frontend commit per run
(`.github/actions/resolve-paired-ref`, byte-identical in both repos): a
`Frontend-Ref: <branch>` line in the PR body, else the same-named branch, else
`main`. Merge the backend half of a paired change first.

## One-time GitHub setup

- **Secret `FRONTEND_REPO_TOKEN`** (private repos only): a fine-grained PAT
  with `Contents: read` on the frontend repo (`github.token` cannot read a
  sibling private repo).
- **Variable `FRONTEND_REPOSITORY`** (optional): `owner/name` if the frontend is
  not `<this owner>/test-ci-cd-frontend`.
- **Branch protection / ruleset** on `main` requiring the `CI` check. Private
  repos need a paid plan (Team) for this.

## Dependabot

Minor and patch updates arrive weekly as one grouped PR. **Majors are ignored
on purpose**: with Wait for CI, a merged Dependabot PR deploys straight to
production. Upgrade a major by hand, on a branch.

## Railway (CD)

One Railway project with **Postgres** and an **api** service linked to this
repo, branch `main`, **Wait for CI on**. Railway builds the `Dockerfile` at the
repo root.

Everything about those three resources — build, pre-deploy migration,
healthcheck, restart policy, draining, variables, Wait for CI — is declared in
**`.railway/railway.ts`**. Railway does not read that file during deploys, so:

```bash
railway login && railway link   # once: project melodious-consideration, env production
npm run railway:plan            # read-only diff between the file and Railway
npm run railway:apply           # apply it
```

The file is a named partial (`api`): it owns only the api service, Postgres and
its volume, so applying it never touches the frontend's `web` service, which
`test-ci-cd-frontend/.railway/railway.ts` owns. Change settings there, not in
the dashboard — a dashboard edit shows up as drift in the next plan.

Rollback: redeploy a previous deployment from the Railway dashboard.
