import { db } from '../client'
import { tracking_events } from '../schema/trackingEvents'

export async function logTrackingEvent(params: {
  orderId: string
  userId: string
  awbNumber?: string | null
  courier?: string | null
  statusCode?: string | null
  statusText?: string | null
  location?: string | null
  raw?: any
  createdAt?: Date | string | null
}) {
  const { orderId, userId, awbNumber, courier, statusCode, statusText, location, raw, createdAt } = params
  const parsedCreatedAt = createdAt ? new Date(createdAt) : null
  const values: any = {
    order_id: orderId,
    user_id: userId,
    awb_number: awbNumber || null,
    courier: courier || null,
    status_code: statusCode || null,
    status_text: statusText || null,
    location: location || null,
    raw: raw || null,
  }

  if (parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())) {
    values.created_at = parsedCreatedAt
  }

  await db.insert(tracking_events).values(values)
}
