import Joi from 'joi'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'testing', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  // One connection string, not host/port/user parts: it is what Railway's
  // Postgres service exposes (`DATABASE_URL=${{Postgres.DATABASE_URL}}`), and
  // local .env files spell it the same way so there is one code path.
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  // Comma-separated origins allowed to call the API cross-origin — the SPA's
  // deployed origin(s). Empty means CORS stays off, which is fine when the SPA
  // reaches the API through a same-origin proxy (vite dev server).
  CORS_ORIGINS: Joi.string().allow('').default(''),
  // Express `trust proxy`: a hop count ("1" behind Railway's one proxy),
  // "true", or a subnet list ("loopback", "10.0.0.0/8"). Empty — the default —
  // trusts no proxy, which is right when nothing sits in front of the app.
  TRUST_PROXY: Joi.string().allow('').default(''),
  SWAGGER_ENABLED: Joi.boolean().default(false),
})
