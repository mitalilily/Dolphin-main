import * as dotenv from 'dotenv'
import path from 'path'
import { IcarryService } from '../models/services/couriers/icarry.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const maskToken = (token: string) => {
  if (!token) return ''
  if (token.length <= 8) return '****'
  return `${token.slice(0, 4)}${'*'.repeat(Math.max(token.length - 8, 0))}${token.slice(-4)}`
}

async function main() {
  const service = new IcarryService()
  const result = await service.login(true)

  console.log('[iCarry Login Test] Success')
  console.log(
    JSON.stringify(
      {
        message: result?.raw?.success || 'API session started',
        hasApiToken: Boolean(result?.apiToken),
        apiTokenMasked: maskToken(String(result?.apiToken || '')),
      },
      null,
      2,
    ),
  )
}

main().catch((error: any) => {
  console.error('[iCarry Login Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
