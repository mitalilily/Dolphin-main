export type RazorpayMode = 'test' | 'live'

export type WalletCreditCheckInput = {
  currentMode: RazorpayMode
  topupMeta?: unknown
  topupAmount: number | string
  capturedAmountPaise: number
  topupCurrency?: string | null
  capturedCurrency?: string | null
}

export type WalletCreditCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; message: string }

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

export const readTopupRazorpayMode = (meta: unknown): RazorpayMode | null => {
  const topLevel = asRecord(meta)
  const nested = asRecord(topLevel.razorpay)
  const mode = String(topLevel.razorpayMode || nested.mode || '').trim().toLowerCase()
  return mode === 'live' || mode === 'test' ? mode : null
}

export const expectedPaiseForTopup = (amount: number | string): number | null => {
  const rupees = Number(amount)
  if (!Number.isFinite(rupees) || rupees <= 0) return null
  return Math.round(rupees * 100)
}

export const validateRazorpayWalletCredit = ({
  currentMode,
  topupMeta,
  topupAmount,
  capturedAmountPaise,
  topupCurrency,
  capturedCurrency,
}: WalletCreditCheckInput): WalletCreditCheckResult => {
  if (currentMode !== 'live') {
    return {
      allowed: false,
      reason: 'razorpay_live_mode_required',
      message: 'Wallet recharge credits are blocked while Razorpay is not in live mode.',
    }
  }

  const topupMode = readTopupRazorpayMode(topupMeta)
  if (topupMode && topupMode !== 'live') {
    return {
      allowed: false,
      reason: 'topup_created_in_test_mode',
      message: 'This wallet top-up was created in Razorpay test mode and cannot credit balance.',
    }
  }

  const expectedPaise = expectedPaiseForTopup(topupAmount)
  const paidPaise = Math.round(Number(capturedAmountPaise))
  if (!expectedPaise || !Number.isFinite(paidPaise) || expectedPaise !== paidPaise) {
    return {
      allowed: false,
      reason: 'amount_mismatch',
      message: 'Captured Razorpay amount does not match the wallet top-up amount.',
    }
  }

  const expectedCurrency = String(topupCurrency || 'INR').trim().toUpperCase()
  const paidCurrency = capturedCurrency ? String(capturedCurrency).trim().toUpperCase() : expectedCurrency
  if (expectedCurrency !== paidCurrency) {
    return {
      allowed: false,
      reason: 'currency_mismatch',
      message: 'Captured Razorpay currency does not match the wallet top-up currency.',
    }
  }

  return { allowed: true }
}
