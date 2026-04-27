import { Request, Response } from 'express'

type IcarrySyncStatusPayload = {
  client_name?: string
  callback_type?: 'sync_status'
  awb?: string
  status?: number | string
  token?: string
  [key: string]: any
}

type IcarryNdrRecord = {
  shipment_id?: number | string
  awb?: string
  type?: string
  date_added?: string
  [key: string]: any
}

type IcarryNdrStatusPayload = {
  client_name?: string
  callback_type?: 'ndr_status'
  token?: string
  ndr_data?: IcarryNdrRecord[]
  [key: string]: any
}

const normalizeToken = (value: any) => String(value || '').trim()

export const icarryWebhookHandler = async (req: Request, res: Response) => {
  const payload = (req.body || {}) as IcarrySyncStatusPayload | IcarryNdrStatusPayload
  const callbackType = String(payload?.callback_type || '').trim()
  const clientName = String(payload?.client_name || '').trim().toLowerCase()

  if (clientName && clientName !== 'icarry') {
    return res.status(400).json({ success: false, message: 'Invalid client_name' })
  }

  const configuredToken = normalizeToken(process.env.ICARRY_WEBHOOK_TOKEN || process.env.ICARRY_API_KEY)
  const incomingToken = normalizeToken((payload as any)?.token)

  if (configuredToken && incomingToken && configuredToken !== incomingToken) {
    return res.status(401).json({ success: false, message: 'Invalid webhook token' })
  }

  if (callbackType === 'sync_status') {
    const syncPayload = payload as IcarrySyncStatusPayload
    if (!String(syncPayload.awb || '').trim()) {
      return res.status(400).json({ success: false, message: 'awb is required for sync_status' })
    }
    if (!String(syncPayload.status ?? '').trim()) {
      return res.status(400).json({ success: false, message: 'status is required for sync_status' })
    }

    console.log('[iCarry Webhook] sync_status', {
      awb: String(syncPayload.awb),
      status: String(syncPayload.status),
      payload,
    })

    return res.status(200).json({ success: true, message: 'sync_status received' })
  }

  if (callbackType === 'ndr_status') {
    const ndrPayload = payload as IcarryNdrStatusPayload
    const ndrData = Array.isArray(ndrPayload.ndr_data) ? ndrPayload.ndr_data : []
    if (!ndrData.length) {
      return res.status(400).json({ success: false, message: 'ndr_data array is required for ndr_status' })
    }

    console.log('[iCarry Webhook] ndr_status', {
      records: ndrData.length,
      sample: ndrData[0] || null,
    })

    return res.status(200).json({ success: true, message: 'ndr_status received', records: ndrData.length })
  }

  return res.status(400).json({
    success: false,
    message: 'Unsupported callback_type. Expected sync_status or ndr_status',
  })
}
