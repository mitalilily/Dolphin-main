jest.mock('../../src/models/services/upload.service', () => ({
  presignDownload: jest.fn(async (key: string) => `https://files.example/${key}`),
}))

import {
  isOrderManifestedForDocuments,
  sanitizeOrderForCustomer,
} from '../../src/utils/orderSanitizer'

describe('orderSanitizer manifest document visibility', () => {
  it('hides AWB and documents before manifest completion', async () => {
    const sanitized = await sanitizeOrderForCustomer({
      id: 'order-1',
      order_number: 'ORD-1',
      integration_type: 'delhivery',
      order_status: 'booked',
      awb_number: 'AWB-1',
      label: 'labels/one.pdf',
      manifest: 'manifests/one.pdf',
      invoice_link: 'invoices/one.pdf',
      courier_cost: 99,
    })

    expect(isOrderManifestedForDocuments(sanitized)).toBe(false)
    expect(sanitized.awb_number).toBeNull()
    expect(sanitized.label).toBeNull()
    expect(sanitized.label_key).toBeNull()
    expect(sanitized.manifest).toBeNull()
    expect(sanitized.invoice_link).toBeNull()
    expect(sanitized.courier_cost).toBeUndefined()
  })

  it('exposes AWB and document URLs after manifest completion', async () => {
    const sanitized = await sanitizeOrderForCustomer({
      id: 'order-2',
      order_number: 'ORD-2',
      integration_type: 'delhivery',
      order_status: 'pickup_initiated',
      awb_number: 'AWB-2',
      label: 'labels/two.pdf',
      manifest: 'manifests/two.pdf',
      invoice_link: 'invoices/two.pdf',
    })

    expect(isOrderManifestedForDocuments(sanitized)).toBe(true)
    expect(sanitized.awb_number).toBe('AWB-2')
    expect(sanitized.label_key).toBe('labels/two.pdf')
    expect(sanitized.label_url).toBe('https://files.example/labels/two.pdf')
    expect(sanitized.manifest_url).toBe('https://files.example/manifests/two.pdf')
    expect(sanitized.invoice_url).toBe('https://files.example/invoices/two.pdf')
  })
})
