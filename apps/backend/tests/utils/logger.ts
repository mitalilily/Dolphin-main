/* eslint-disable no-console */
export const qaLog = {
  step: (title: string, details?: unknown) => {
    console.log(`\n[QA STEP] ${title}`)
    if (details !== undefined) {
      console.log('[QA DETAIL]', details)
    }
  },
  pass: (title: string, details?: unknown) => {
    console.log(`[QA PASS] ${title}`)
    if (details !== undefined) {
      console.log('[QA DETAIL]', details)
    }
  },
  fail: (title: string, error: unknown) => {
    console.error(`[QA FAIL] ${title}`)
    console.error(error)
  },
  info: (message: string, details?: unknown) => {
    console.log(`[QA INFO] ${message}`)
    if (details !== undefined) {
      console.log('[QA DETAIL]', details)
    }
  },
}
