import { ConfigService } from '@nestjs/config'

import { AppConfigService } from 'src/config/app-config.service'

function serviceWith(env: Record<string, unknown>): AppConfigService {
  return new AppConfigService(new ConfigService(env))
}

describe('AppConfigService', () => {
  describe('trustProxy', () => {
    it.each([
      ['', false],
      ['false', false],
      ['true', true],
      ['1', 1],
      ['loopback, 10.0.0.0/8', 'loopback, 10.0.0.0/8'],
    ])('parses TRUST_PROXY=%p as %p', (raw, expected) => {
      expect(serviceWith({ TRUST_PROXY: raw }).trustProxy).toBe(expected)
    })
  })

  describe('corsOrigins', () => {
    it('splits and trims, dropping empty entries', () => {
      const service = serviceWith({
        CORS_ORIGINS: 'https://a.example.com, https://b.example.com,',
      })

      expect(service.corsOrigins).toEqual([
        'https://a.example.com',
        'https://b.example.com',
      ])
    })
  })
})
