type RawAuthError = {
  response?: { data?: unknown }
  code?: string
  message?: string
}

const extractMessages = (value: unknown): string[] => {
  if (!value) return []

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractMessages)
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const prioritizedKeys = ['error', 'message', 'msg', 'detail', 'details', 'errors']

    const collected = prioritizedKeys.flatMap((key) => extractMessages(record[key]))
    if (collected.length > 0) return collected

    return Object.values(record).flatMap(extractMessages)
  }

  return []
}

export const getAuthErrorMessage = (err: unknown, fallback: string) => {
  const errObj = err as RawAuthError
  const messages = extractMessages(errObj.response?.data)
  const message = messages.filter(Boolean).slice(0, 3).join(' • ') || errObj.message || fallback

  const isNetwork = errObj.code === 'ERR_NETWORK' || !errObj.response
  if (!isNetwork) return message

  const base = import.meta.env.VITE_API_URL || 'https://delexpress-backend.onrender.com/api'
  return `Cannot reach API (${base}). Start backend or set VITE_API_URL.`
}
