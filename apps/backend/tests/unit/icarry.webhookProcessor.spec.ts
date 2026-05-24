jest.mock('../../src/models/client', () => ({ db: {} }))

const { __webhookProcessorTestUtils: utils } = require('../../src/models/services/webhookProcessor')

describe('iCarry webhook normalization', () => {
  it('maps iCarry numeric shipment status codes to internal order statuses', () => {
    expect(utils.mapIcarryStatus(21)).toEqual({
      internalStatus: 'delivered',
      statusText: 'Delivered',
    })
    expect(utils.mapIcarryStatus('23')).toEqual({
      internalStatus: 'rto_delivered',
      statusText: 'Returned to Origin',
    })
    expect(utils.mapIcarryStatus('26')).toEqual({
      internalStatus: 'out_for_delivery',
      statusText: 'Out For Delivery',
    })
  })

  it('normalizes daily iCarry NDR event batches', () => {
    const payload = {
      client_name: 'icarry',
      callback_type: 'ndr_status',
      ndr_data: [
        {
          shipment_id: 249772,
          awb: '162419608174',
          type: 'CONSIGNEE-OPENED\u0002REFUSED',
          date_added: '23/01/2025',
        },
      ],
    }

    const items = utils.getIcarryNdrItems(payload)

    expect(items).toHaveLength(1)
    expect(utils.normalizeIcarryNdrType(items[0].type)).toBe('CONSIGNEE-OPENED-REFUSED')
    expect(utils.describeIcarryNdrType('REATTEMPT-COD-NOT-READY')).toContain('COD amount')
  })

  it('treats iCarry billed weight as grams when reconciling webhook weight', () => {
    const weights = utils.resolveWebhookWeights(
      'icarry',
      { weight: '1300', miles: '100.24' },
      { weight: 0.5 },
    )

    expect(weights.declaredWeight).toBe(0.5)
    expect(weights.chargedWeight).toBe(1.3)
  })

  it('accepts explicit iCarry callback types used by dashboard webhook fields', () => {
    expect(utils.isIcarryStatusCallbackType('sync_status')).toBe(true)
    expect(utils.isIcarryStatusCallbackType('shipment_status')).toBe(true)
    expect(utils.isIcarryWeightCallbackType('weight_dispute')).toBe(true)
    expect(utils.isIcarryWeightCallbackType('new_weight_discrepancy')).toBe(true)
  })

  it('normalizes nested iCarry webhook data for status and weight events', () => {
    const event = utils.getIcarryCourierEvent({
      callback_type: 'weight_dispute',
      data: {
        shipment_id: 249772,
        weight: '1300',
      },
    })

    expect(event.shipment_id).toBe(249772)
    expect(event.weight).toBe('1300')
    expect(event.callback_type).toBe('weight_dispute')
  })
})
