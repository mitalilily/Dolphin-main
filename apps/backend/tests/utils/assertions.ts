import { AxiosError } from 'axios'

export const getStatusCode = (error: unknown): number | undefined => {
  const maybeAxios = error as AxiosError
  return maybeAxios?.response?.status
}

export const expectStatusIn = (status: number | undefined, allowed: number[]) => {
  expect(status).toBeDefined()
  expect(allowed).toContain(status as number)
}
