export type RetryOptions = {
  retries: number
  delayMs: number
  shouldRetry?: (error: unknown) => boolean
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const shouldRetry = options.shouldRetry || (() => true)
  let lastError: unknown

  for (let attempt = 1; attempt <= options.retries + 1; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt > options.retries || !shouldRetry(error)) {
        throw error
      }
      await sleep(options.delayMs)
    }
  }

  throw lastError
}
