import { Request, Response } from 'express'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../../models/client'
import { courier_credentials } from '../../models/schema/courierCredentials'
import { pending_webhooks } from '../../schema/schema'
import { processGenericCourierWebhook } from '../../models/services/webhookProcessor'

const normalizeToken = (value: any) => String(value || '').trim()

const WEBHOOK_SECRET_HEADERS = [
  'x-webhook-secret',
  'x-webhook-signature',
  'x-courier-webhook-secret',
  'x-api-key',
  'authorization',
]

const readSecretHeader = (headers: Request['headers']) => {
  const normalized = headers as Record<string, string | string[] | undefined>
  for (const header of WEBHOOK_SECRET_HEADERS) {
    const value = normalized[header] || normalized[header.toLowerCase()]
    if (!value) continue
    if (Array.isArray(value) && value.length) return normalizeToken(value[0]).replace(/^Bearer\s+/i, '')
    if (typeof value === 'string' && value.trim()) return value.trim().replace(/^Bearer\s+/i, '')
  }
  return ''
}

const providerEnvToken = (provider: string) => {
  const p = String(provider || '').trim().toUpperCase()
  return normalizeToken(process.env[`${p}_WEBHOOK_TOKEN`] || process.env[`${p}_API_KEY`] || '')
}

const fetchProviderSecret = async (provider: string) => {
  const [row] = await db
    .select({
      webhookSecret: courier_credentials.webhookSecret,
      apiKey: courier_credentials.apiKey,
    })
    .from(courier_credentials)
    .where(eq(courier_credentials.provider, provider))
    .limit(1)

  return normalizeToken(row?.webhookSecret || row?.apiKey || providerEnvToken(provider))
}

const extractWebhookMeta = (payload: any) => {
  const event = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : payload
  const firstNdrEvent = Array.isArray(event?.ndr_data) ? event.ndr_data[0] : null
  const awb =
    firstNdrEvent?.awb ||
    firstNdrEvent?.awb_number ||
    firstNdrEvent?.shipment_id ||
    event?.awb_number ||
    event?.awb ||
    event?.waybill ||
    event?.tracking_no ||
    event?.tracking_id ||
    event?.trackingId ||
    event?.wbn ||
    event?.shipment_id ||
    event?.refrence_id ||
    event?.reference_id ||
    event?.reference_number ||
    event?.order_id ||
    null
  const status =
    firstNdrEvent?.type ||
    firstNdrEvent?.status ||
    event?.current_status ||
    event?.shipment_status ||
    event?.status ||
    event?.event ||
    event?.event_name ||
    event?.status_feed?.scan?.[0]?.status ||
    event?.statusFeed?.scan?.[0]?.status ||
    'unknown'
  return { awb, status }
}

export const createProviderWebhookHandler = (provider: string) => {
  const normalizedProvider = String(provider || '').trim().toLowerCase()

  return async (req: Request, res: Response) => {
    const payload = req.body || {}
    const { awb, status } = extractWebhookMeta(payload)

    try {
      const configuredSecret = await fetchProviderSecret(normalizedProvider)
      const receivedSecret = readSecretHeader(req.headers) || normalizeToken((payload as any)?.token)

      if (configuredSecret && receivedSecret && configuredSecret !== receivedSecret) {
        return res.status(401).json({ success: false, message: 'Invalid webhook token' })
      }

      const result = await processGenericCourierWebhook(normalizedProvider, payload)
      if (!result.success && result.reason === 'missing_awb') {
        return res.status(400).json({ success: false, message: 'Missing AWB/order reference' })
      }

      if (
        !result.success &&
        ['invalid_callback_type', 'invalid_payload'].includes(String(result.reason || ''))
      ) {
        return res.status(400).json({
          success: false,
          message: (result as any).message || result.reason,
        })
      }

      if (!result.success && result.reason === 'order_not_found') {
        const dedupeWindowStart = new Date(Date.now() - 10 * 60 * 1000)
        const [existingPending] = await db
          .select({ id: pending_webhooks.id })
          .from(pending_webhooks)
          .where(
            and(
              eq(pending_webhooks.awb_number, String(awb || 'unknown')),
              eq(pending_webhooks.status, `${normalizedProvider}:${String(status || 'unknown')}`),
              isNull(pending_webhooks.processed_at),
              gte(pending_webhooks.created_at, dedupeWindowStart),
            ),
          )
          .limit(1)

        if (!existingPending) {
          await db.insert(pending_webhooks).values({
            awb_number: awb || null,
            status: `${normalizedProvider}:${String(status || 'unknown')}`,
            payload: {
              __provider: normalizedProvider,
              body: payload,
            },
          })
        }

        return res.status(202).json({ success: true, queued: true })
      }

      if (!result.success) {
        return res.status(202).json({ success: false, reason: result.reason })
      }

      return res.status(200).json({ success: true })
    } catch (err: any) {
      console.error(`❌ ${normalizedProvider} webhook processing failed:`, err?.message || err)
      return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
  }
}
