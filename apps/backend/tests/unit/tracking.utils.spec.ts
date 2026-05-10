import { HttpError } from '../../src/utils/classes'
import {
  getHttpStatusCode,
  normalizeAwb,
  normalizePhoneDigits,
  normalizeTrackingStatusCode,
  parseTrackingQuery,
  resolveTrackingProviderKey,
} from '../../src/utils/tracking'

describe('tracking utilities', () => {
  it('normalizes AWB and phone inputs', () => {
    expect(normalizeAwb(' sr 123  ')).toBe('SR123')
    expect(normalizePhoneDigits('+91 98765 43210')).toBe('9876543210')
    expect(normalizePhoneDigits('09876543210')).toBe('9876543210')
  })

  it('parses AWB tracking queries before order/contact mode', () => {
    expect(parseTrackingQuery({ awb: ' awb 001 ', orderNumber: 'ORD-1' })).toEqual({
      mode: 'awb',
      awb: 'AWB001',
    })
  })

  it('accepts email and formatted phone contacts for order tracking', () => {
    expect(parseTrackingQuery({ orderNumber: 'ORD-1', contact: 'Buyer@Example.com' })).toEqual({
      mode: 'order',
      orderNumber: 'ORD-1',
      contact: 'Buyer@Example.com',
      email: 'buyer@example.com',
    })

    expect(parseTrackingQuery({ orderNumber: 'ORD-1', contact: '+91 98765 43210' })).toEqual({
      mode: 'order',
      orderNumber: 'ORD-1',
      contact: '+91 98765 43210',
      phone: '9876543210',
    })
  })

  it('returns structured bad request errors for missing or invalid queries', () => {
    expect(() => parseTrackingQuery({})).toThrow(HttpError)
    expect(() => parseTrackingQuery({ orderNumber: 'ORD-1', contact: 'not-a-contact' })).toThrow(
      'Contact must be a valid email or phone number',
    )
  })

  it('resolves courier partner before stale/default integration values', () => {
    expect(resolveTrackingProviderKey('delhivery', 'Shiprocket Surface')).toBe('shiprocket')
    expect(resolveTrackingProviderKey(null, 'iCarry Express')).toBe('icarry')
    expect(resolveTrackingProviderKey('truxcargo', null)).toBe('truxcargo')
  })

  it('normalizes status and preserves expected HTTP statuses', () => {
    expect(normalizeTrackingStatusCode('Out for Delivery')).toBe('OFD')
    expect(normalizeTrackingStatusCode('rto delivered')).toBe('RT-DL')
    expect(getHttpStatusCode(new HttpError(404, 'Missing'))).toBe(404)
    expect(getHttpStatusCode({ response: { status: 502 } })).toBe(502)
  })
})

