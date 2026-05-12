import {
  detectRazorpayKeyMode,
  getRazorpayConfigurationError,
  readRazorpayMode,
  resolveRazorpayCredentials,
} from '../../src/utils/razorpay'

describe('razorpay configuration', () => {
  it('defaults production to live mode and development to test mode', () => {
    expect(readRazorpayMode({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe('live')
    expect(readRazorpayMode({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe('test')
    expect(
      readRazorpayMode({ NODE_ENV: 'production', RAZORPAY_MODE: 'test' } as NodeJS.ProcessEnv),
    ).toBe('live')
    expect(
      readRazorpayMode({
        NODE_ENV: 'production',
        RAZORPAY_MODE: 'test',
        ALLOW_RAZORPAY_TEST_IN_PRODUCTION: 'true',
      } as NodeJS.ProcessEnv),
    ).toBe('test')
    expect(
      readRazorpayMode({ NODE_ENV: 'development', RAZORPAY_MODE: 'live' } as NodeJS.ProcessEnv),
    ).toBe('live')
  })

  it('uses explicit live credential variables before generic aliases', () => {
    const credentials = resolveRazorpayCredentials('live', {
      RAZORPAY_KEY_ID: 'rzp_test_generic',
      RAZORPAY_KEY_SECRET: 'test-secret',
      RAZORPAY_KEY_ID_PROD: 'rzp_live_real',
      RAZORPAY_KEY_SECRET_PROD: 'live-secret',
      RAZORPAY_WEBHOOK_SECRET_PROD: 'webhook-secret',
    } as NodeJS.ProcessEnv)

    expect(credentials.key_id).toBe('rzp_live_real')
    expect(credentials.key_secret).toBe('live-secret')
    expect(credentials.key_id_source).toBe('RAZORPAY_KEY_ID_PROD')
    expect(credentials.key_id_mode).toBe('live')
    expect(getRazorpayConfigurationError('live', credentials)).toBeNull()
  })

  it('blocks live mode when a test key would be selected', () => {
    const credentials = resolveRazorpayCredentials('live', {
      RAZORPAY_KEY_ID: 'rzp_test_wrong',
      RAZORPAY_KEY_SECRET: 'test-secret',
    } as NodeJS.ProcessEnv)

    expect(detectRazorpayKeyMode(credentials.key_id)).toBe('test')
    expect(getRazorpayConfigurationError('live', credentials)).toContain(
      'is a test key',
    )
  })
})
