import cron from 'node-cron'
import { isRazorpayConfigured, razorpayWalletTopupsEnabled } from '../utils/razorpay'
import { generateAutoBillingInvoices } from './invoiceGenerator'
import { processPendingWebhooks } from './processPendingWebhooks'
import { reconcileWalletTopups } from './reconcileWalletTopups'
import { seedHolidaysCron } from './seedHolidays'
import {
  sendDailyWeightReconciliationEmails,
  sendWeeklyWeightReconciliationEmails,
} from './weightReconciliationEmails'
import { pollEkartTracking } from './ekartTracking'
import { pollTruxcargoTracking } from './truxcargoTracking'

if (razorpayWalletTopupsEnabled) {
  cron.schedule('*/20 * * * *', async () => {
    console.log('[Cron] Wallet reconciliation kicking off')
    try {
      await reconcileWalletTopups()
    } catch (err) {
      console.error('[Cron] Wallet reconciliation failed:', err)
    }
  })
} else if (!isRazorpayConfigured) {
  console.warn('[Cron] Wallet reconciliation skipped because Razorpay credentials are missing.')
} else {
  console.warn('[Cron] Wallet reconciliation skipped because Razorpay wallet top-ups require live mode.')
}

cron.schedule('*/1 * * * *', () => {
  processPendingWebhooks().catch((err) => console.error('Error in cron webhook processor', err))
})

cron.schedule('0 2 * * *', () => generateAutoBillingInvoices())

cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Daily weight reconciliation emails starting...')
  try {
    await sendDailyWeightReconciliationEmails()
  } catch (err) {
    console.error('[Cron] Daily weight reconciliation emails failed:', err)
  }
})

cron.schedule('0 9 * * 1', async () => {
  console.log('[Cron] Weekly weight reconciliation reports starting...')
  try {
    await sendWeeklyWeightReconciliationEmails()
  } catch (err) {
    console.error('[Cron] Weekly weight reconciliation reports failed:', err)
  }
})

cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Ekart tracking poll')
  try {
    await pollEkartTracking()
  } catch (err) {
    console.error('[Cron] Ekart tracking poll failed:', err)
  }
})

cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Truxcargo tracking poll (fast bucket)')
  try {
    const stats = await pollTruxcargoTracking({ bucket: 'fast', batchSize: 100 })
    console.log('[Cron] Truxcargo fast poll stats:', stats)
  } catch (err) {
    console.error('[Cron] Truxcargo fast tracking poll failed:', err)
  }
})

cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Truxcargo tracking poll (normal bucket)')
  try {
    const stats = await pollTruxcargoTracking({ bucket: 'normal', batchSize: 200 })
    console.log('[Cron] Truxcargo normal poll stats:', stats)
  } catch (err) {
    console.error('[Cron] Truxcargo normal tracking poll failed:', err)
  }
})

cron.schedule('0 0 1 1 *', () => {
  console.log('[Cron] Holiday seeding cron triggered (January 1st)')
  seedHolidaysCron().catch((err) => console.error('Error in holiday seeding cron', err))
})
