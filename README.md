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

## CI (`.github/workflows/ci.yml`)

`checks` (lint, format, typecheck, unit, build ×2 + `dist/` layout assertion),
`e2e` (real Postgres), `frontend-e2e` (the frontend's Playwright suite against
this branch), and one aggregate `CI` job — the only check branch protection
needs to require.

`frontend-e2e` picks the frontend commit per run
(`.github/actions/resolve-paired-ref`, byte-identical in both repos): a
`Frontend-Ref: <branch>` line in the PR body, else the same-named branch, else
`main`. Merge the backend half of a paired change first.

## One-time GitHub setup

- **Secret `FRONTEND_REPO_TOKEN`**: a fine-grained PAT with `Contents: read` on
  the frontend repo (`github.token` cannot read a sibling private repo).
- **Variable `FRONTEND_REPOSITORY`** (optional): `owner/name` if the frontend is
  not `<this owner>/test-ci-cd-frontend`.
- **Branch protection / ruleset** on `main` requiring the `CI` check. Private
  repos need a paid plan (Team) for this.

## Railway (CD)

Per environment, one Railway project with a **Postgres** service and an **api**
service linked to this repo, branch `main`, **Wait for CI on**. Build, pre-deploy
migration, healthcheck and restart policy live in `railway.json`. Set on the api
service:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `CORS_ORIGINS=https://<web service domain>`
- `SWAGGER_ENABLED=false` (default) or `true`

Rollback: redeploy a previous deployment from the Railway dashboard.
