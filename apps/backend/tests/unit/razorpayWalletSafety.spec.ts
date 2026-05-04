import {
  expectedPaiseForTopup,
  readTopupRazorpayMode,
  validateRazorpayWalletCredit,
} from '../../src/utils/razorpayWalletSafety'

describe('razorpay wallet safety', () => {
  it('blocks wallet credits while runtime is in Razorpay test mode', () => {
    const result = validateRazorpayWalletCredit({
      currentMode: 'test',
      topupMeta: { razorpayMode: 'test' },
      topupAmount: 500,
      capturedAmountPaise: 50000,
      topupCurrency: 'INR',
      capturedCurrency: 'INR',
    })

    expect(result).toMatchObject({
      allowed: false,
      reason: 'razorpay_live_mode_required',
    })
  })

  it('blocks top-ups created in test mode even when runtime later becomes live', () => {
    const result = validateRazorpayWalletCredit({
      currentMode: 'live',
      topupMeta: { razorpay: { mode: 'test' } },
      topupAmount: 500,
      capturedAmountPaise: 50000,
      topupCurrency: 'INR',
      capturedCurrency: 'INR',
    })

    expect(result).toMatchObject({
      allowed: false,
      reason: 'topup_created_in_test_mode',
    })
  })

  it('requires captured amount and currency to match the wallet top-up', () => {
    expect(
      validateRazorpayWalletCredit({
        currentMode: 'live',
        topupMeta: { razorpayMode: 'live' },
        topupAmount: 500,
        capturedAmountPaise: 49900,
        topupCurrency: 'INR',
        capturedCurrency: 'INR',
      }),
    ).toMatchObject({ allowed: false, reason: 'amount_mismatch' })

    expect(
      validateRazorpayWalletCredit({
        currentMode: 'live',
        topupMeta: { razorpayMode: 'live' },
        topupAmount: 500,
        capturedAmountPaise: 50000,
        topupCurrency: 'INR',
        capturedCurrency: 'USD',
      }),
    ).toMatchObject({ allowed: false, reason: 'currency_mismatch' })
  })

  it('allows exactly matched live captured wallet top-ups', () => {
    const result = validateRazorpayWalletCredit({
      currentMode: 'live',
      topupMeta: { razorpayMode: 'live' },
      topupAmount: '500.00',
      capturedAmountPaise: 50000,
      topupCurrency: 'INR',
      capturedCurrency: 'inr',
    })

    expect(result).toEqual({ allowed: true })
  })

  it('normalizes legacy and nested metadata safely', () => {
    expect(readTopupRazorpayMode({ razorpayMode: 'live' })).toBe('live')
    expect(readTopupRazorpayMode({ razorpay: { mode: 'test' } })).toBe('test')
    expect(readTopupRazorpayMode({})).toBeNull()
    expect(expectedPaiseForTopup('10.25')).toBe(1025)
  })
})
