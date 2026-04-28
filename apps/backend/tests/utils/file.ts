import fs from 'fs'
import path from 'path'

export const readJsonFile = <T>(relativePath: string): T => {
  const absolute = path.resolve(process.cwd(), relativePath)
  const raw = fs.readFileSync(absolute, 'utf8')
  return JSON.parse(raw) as T
}
