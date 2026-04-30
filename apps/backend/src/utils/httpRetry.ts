export type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (error: any, attempt: number) => boolean
}

const DEFAULT_ATTEMPTS = 3
const DEFAULT_BASE_DELAY_MS = 250
const DEFAULT_MAX_DELAY_MS = 2000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const defaultShouldRetry = (error: any, attempt: number) => {
  if (attempt >= DEFAULT_ATTEMPTS) return false

  const status = Number(error?.response?.status || error?.statusCode || 0)
  const code = String(error?.code || '').toUpperCase()

  if (status >= 500) return true
  if (['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(code)) return true

  return false
}

export const withRetry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const attempts = Math.max(1, Number(options.attempts ?? DEFAULT_ATTEMPTS))
  const baseDelayMs = Math.max(1, Number(options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS))
  const maxDelayMs = Math.max(baseDelayMs, Number(options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS))
  const shouldRetry =
    options.shouldRetry ||
    ((error: any, attempt: number) => {
      const status = Number(error?.response?.status || error?.statusCode || 0)
      const code = String(error?.code || '').toUpperCase()
      if (attempt >= attempts) return false
      return status >= 500 || ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(code)
    })

  let lastError: any = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      if (!shouldRetry(error, attempt)) break
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
      await sleep(delay)
    }
  }

  throw lastError
}

export const retryDefaults = {
  attempts: DEFAULT_ATTEMPTS,
  baseDelayMs: DEFAULT_BASE_DELAY_MS,
  maxDelayMs: DEFAULT_MAX_DELAY_MS,
  shouldRetry: defaultShouldRetry,
}

