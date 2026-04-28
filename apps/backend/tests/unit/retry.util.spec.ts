import { withRetry } from '../utils/retry'

describe('withRetry utility', () => {
  it('retries and eventually succeeds', async () => {
    let attempts = 0

    const result = await withRetry(
      async () => {
        attempts += 1
        if (attempts < 3) {
          throw new Error('Transient failure')
        }
        return 'ok'
      },
      { retries: 3, delayMs: 10 },
    )

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('stops retrying when shouldRetry returns false', async () => {
    let attempts = 0

    await expect(
      withRetry(
        async () => {
          attempts += 1
          throw new Error('Fatal')
        },
        {
          retries: 5,
          delayMs: 10,
          shouldRetry: (error) => !String((error as Error).message).includes('Fatal'),
        },
      ),
    ).rejects.toThrow('Fatal')

    expect(attempts).toBe(1)
  })
})
