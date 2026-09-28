import type { ValidationError } from 'joi'

import { envValidationSchema } from 'src/config/env.validation'

// Joi types a validated value as `any`; pin it at this one boundary.
function validate(env: Record<string, unknown>): {
  error?: ValidationError
  value: Record<string, unknown>
} {
  const result = envValidationSchema.validate(env)
  return { error: result.error, value: result.value as Record<string, unknown> }
}

describe('envValidationSchema', () => {
  const valid = { DATABASE_URL: 'postgres://u:p@localhost:5432/app' }

  it('fills in the defaults', () => {
    const { error, value } = validate(valid)

    expect(error).toBeUndefined()
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      CORS_ORIGINS: '',
      SWAGGER_ENABLED: false,
    })
  })

  it('requires DATABASE_URL', () => {
    const { error } = validate({})

    expect(error?.message).toContain('"DATABASE_URL" is required')
  })

  it('rejects a DATABASE_URL that is not postgres', () => {
    const { error } = validate({
      DATABASE_URL: 'mysql://u:p@localhost/app',
    })

    expect(error).toBeDefined()
  })
})
