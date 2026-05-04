const CHUNK_RELOAD_KEY = '__dolphin_chunk_reload__'
const CHUNK_RELOAD_PARAM = '__dolphin_reload'

const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Loading chunk',
  'ChunkLoadError',
]

export const isChunkLoadError = (message?: string) => {
  if (!message) return false
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

const getErrorMessage = (value: unknown) => {
  if (value instanceof Error) return value.message
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message || '')
  }
  return ''
}

export const removeChunkReloadParam = () => {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(CHUNK_RELOAD_PARAM)) return

  url.searchParams.delete(CHUNK_RELOAD_PARAM)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export const recoverFromChunkLoadError = () => {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const previousAttempt = sessionStorage.getItem(CHUNK_RELOAD_KEY)

  if (previousAttempt === currentPath) return false

  sessionStorage.setItem(CHUNK_RELOAD_KEY, currentPath)

  const url = new URL(window.location.href)
  url.searchParams.set(CHUNK_RELOAD_PARAM, String(Date.now()))
  window.location.replace(url.toString())
  return true
}

export const installChunkLoadRecovery = () => {
  removeChunkReloadParam()

  window.addEventListener('error', (event) => {
    const message = getErrorMessage(event.error) || event.message
    if (isChunkLoadError(message)) {
      recoverFromChunkLoadError()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    const message = getErrorMessage(event.reason)
    if (isChunkLoadError(message)) {
      recoverFromChunkLoadError()
    }
  })
}
