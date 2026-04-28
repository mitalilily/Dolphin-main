import axios from 'axios'
import { qaEnv } from './env'

export const api = axios.create({
  baseURL: qaEnv.apiBaseUrl,
  timeout: qaEnv.defaultTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authHeaders = (token?: string) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
