import { sql } from 'drizzle-orm'
import { db } from '../client'
import { invoiceSequences } from '../schema/invoiceSequences'

type DbClient = typeof db

const DEFAULT_PREFIX = 'INV'
const SEQUENCE_PAD = 6

const toSafeString = (value?: string | null) => (value ? value.trim() : '')

export async function reserveInvoiceSequence(userId: string, tx?: DbClient): Promise<number> {
  const dao = tx ?? db
  const [result] = await dao
    .insert(invoiceSequences)
    .values({
      userId,
      lastSequence: 1,
    })
    .onConflictDoUpdate({
      target: invoiceSequences.userId,
      set: {
        lastSequence: sql`${invoiceSequences.lastSequence} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ lastSequence: invoiceSequences.lastSequence })

  const sequence = Number(result?.lastSequence ?? 1)
  return Number.isFinite(sequence) && sequence > 0 ? sequence : 1
}

function fallbackInvoiceNumber(prefix?: string | null, suffix?: string | null) {
  const trimmedPrefix = toSafeString(prefix) || DEFAULT_PREFIX
  const trimmedSuffix = toSafeString(suffix)
  const millis = Date.now().toString().slice(-8)
  return `${trimmedPrefix}${millis}${trimmedSuffix ? trimmedSuffix : ''}`
}

export function formatInvoiceNumber(prefix: string | undefined, sequence: number, suffix: string | undefined) {
  const seqString = String(sequence).padStart(SEQUENCE_PAD, '0')
  const trimmedPrefix = toSafeString(prefix) || DEFAULT_PREFIX
  const trimmedSuffix = toSafeString(suffix)
  return `${trimmedPrefix}${seqString}${trimmedSuffix ? trimmedSuffix : ''}`
}

export async function resolveInvoiceNumber({
  userId,
  existingInvoiceNumber,
  prefix,
  suffix,
  tx,
}: {
  userId: string
  existingInvoiceNumber?: string | null
  prefix?: string | null
  suffix?: string | null
  tx?: DbClient
}) {
  const existing = toSafeString(existingInvoiceNumber)
  if (existing) return existing

  try {
    const sequence = await reserveInvoiceSequence(userId, tx)
    return formatInvoiceNumber(prefix ?? DEFAULT_PREFIX, sequence, suffix ?? '')
  } catch (error: any) {
    // Do not block label/invoice generation if sequence row is unavailable for legacy/broken users.
    console.warn('[Invoice Sequence] Falling back to timestamp invoice number', {
      userId,
      message: error?.message || String(error),
    })
    return fallbackInvoiceNumber(prefix, suffix)
  }
}
