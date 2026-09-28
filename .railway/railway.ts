/**
 * Railway infrastructure for the backend: the api service, its Postgres and
 * the Postgres volume. The web service belongs to test-ci-cd-frontend's own
 * .railway/railway.ts.
 *
 * Railway does NOT read this file during deploys — deploys come from pushes to
 * `main` (Wait for CI on). Changes here reach Railway only via
 * `npm run railway:plan` (safe, read-only) and `npm run railway:apply`.
 */
import {
  defineRailway,
  github,
  postgres,
  project,
  service,
  volume,
} from 'railway/iac'

// A named partial: this repo owns only the resources below, so an apply here
// never deletes the frontend's `web` service (and vice versa).
export const partial = 'api'

export default defineRailway(() => {
  const Postgres = postgres('Postgres', { region: 'sfo' })
  Postgres.networking = { privateNetworkEndpoint: 'postgres' }

  const postgresVolume = volume('postgres-volume', {
    alerts: { usage: { '80': {}, '95': {}, '100': {} } },
    allowOnlineResize: true,
    region: 'sfo',
    sizeMB: 500,
  })

  const api = service('api', {
    // checkSuites = "Wait for CI": a commit on main deploys only once its
    // GitHub checks (the aggregate `CI` job) pass.
    source: github('valeu36/test-ci-cd-backend', { checkSuites: true }),
    build: {
      buildEnvironment: 'V3',
      builder: 'DOCKERFILE',
      dockerfilePath: 'Dockerfile',
    },
    // Runs in the new image before it takes traffic; a failed migration
    // aborts the deploy and the previous one keeps serving.
    preDeploy: 'npm run migration:run:prod',
    healthcheck: '/api/v1/health',
    healthcheckTimeout: 120,
    replicas: { sfo: 1 },
    deploy: { drainingSeconds: 30, restartPolicyMaxRetries: 5 },
    env: {
      PORT: '3000',
      DATABASE_URL: Postgres.env.DATABASE_URL,
      // The web service is owned by the frontend repo's partial, so it is
      // referenced by Railway's own template syntax rather than a typed ref.
      CORS_ORIGINS: 'https://${{web.RAILWAY_PUBLIC_DOMAIN}}',
      // Railway puts exactly one proxy in front of the service.
      TRUST_PROXY: '1',
    },
  })

  return project('melodious-consideration', {
    resources: [api, Postgres, postgresVolume],
  })
})
