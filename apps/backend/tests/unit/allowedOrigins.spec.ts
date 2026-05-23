import { buildCorsOrigin, isAllowedOrigin } from '../../src/config/allowedOrigins'

describe('allowedOrigins', () => {
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  const originalCorsOrigins = process.env.CORS_ORIGINS

  afterEach(() => {
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins
    process.env.CORS_ORIGINS = originalCorsOrigins
  })

  it('allows the Shopnship client and admin auth origins', () => {
    expect(isAllowedOrigin('https://app.shopnship.in')).toBe(true)
    expect(isAllowedOrigin('https://admin.shopnship.in')).toBe(true)
  })

  it('allows configured production origins from env', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://seller.example.com'

    expect(isAllowedOrigin('https://seller.example.com')).toBe(true)
  })

  it('passes preflight origin checks for Shopnship auth surfaces', () => {
    const callback = jest.fn()

    buildCorsOrigin()('https://admin.shopnship.in', callback)
    buildCorsOrigin()('https://app.shopnship.in', callback)

    expect(callback).toHaveBeenNthCalledWith(1, null, true)
    expect(callback).toHaveBeenNthCalledWith(2, null, true)
  })
})
