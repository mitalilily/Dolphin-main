import { Client } from 'pg'
import { ShipmozoService } from './src/models/services/couriers/shipmozo.service'

async function main() {
  const pickup = 122001
  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const q = await db.query(`
    select distinct pincode
    from public.meracourierwala_locations
    where pincode ~ '^[0-9]{6}$'
    order by pincode asc
  `)
  await db.end()

  const pincodes = q.rows.map((r: any) => String(r.pincode))
  const shipmozo = new ShipmozoService()

  const origLog = console.log
  const origErr = console.error
  console.log = () => {}
  console.error = () => {}

  const serviceable: string[] = []
  let failed = 0
  const concurrency = 25
  let idx = 0

  async function worker() {
    while (idx < pincodes.length) {
      const i = idx++
      const pincode = pincodes[i]
      try {
        const resp = await shipmozo.checkPincodeServiceability({
          pickup_pincode: pickup,
          delivery_pincode: Number(pincode),
        })
        if (resp?.data?.serviceable === true) serviceable.push(pincode)
      } catch {
        failed += 1
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  console.log = origLog
  console.error = origErr

  process.stdout.write(JSON.stringify({
    pickup_pincode: pickup,
    checked: pincodes.length,
    serviceable_count: serviceable.length,
    failed_count: failed,
    serviceable: serviceable.sort()
  }, null, 2))
}

main().catch((e)=>{console.error(e);process.exit(1)})
