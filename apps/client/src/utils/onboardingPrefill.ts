const SIGNUP_PREFILL_KEY = 'signupOnboardingPrefill'

const splitName = (fullName: string) => {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const [firstName = '', ...rest] = trimmed.split(' ')
  return {
    firstName,
    lastName: rest.join(' '),
  }
}

export const setOnboardingPrefill = (fullName: string) => {
  if (typeof window === 'undefined') return
  const payload = splitName(fullName)
  sessionStorage.setItem(SIGNUP_PREFILL_KEY, JSON.stringify(payload))
}

export const getOnboardingPrefill = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(SIGNUP_PREFILL_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { firstName: string; lastName: string }
  } catch {
    return null
  }
}

export const clearOnboardingPrefill = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SIGNUP_PREFILL_KEY)
}

