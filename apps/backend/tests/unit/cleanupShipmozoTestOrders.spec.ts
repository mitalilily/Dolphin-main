const cancelOrderMock = jest.fn()
let dbRows: any[] = []

jest.mock('../../src/models/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(async () => dbRows),
        })),
      })),
    })),
  },
}))

jest.mock('../../src/models/services/couriers/shipmozo.service', () => ({
  ShipmozoService: jest.fn().mockImplementation(() => ({
    cancelOrder: cancelOrderMock,
  })),
}))

import {
  buildDateRange,
  loadCleanupConfig,
  runCleanup,
} from '../../src/scripts/cleanupShipmozoTestOrders'

describe('cleanupShipmozoTestOrders', () => {
  beforeEach(() => {
    dbRows = []
    cancelOrderMock.mockReset()
    delete process.env.SHIPMOZO_CLEANUP_FROM_DATE
    delete process.env.SHIPMOZO_CLEANUP_TO_DATE
    delete process.env.SHIPMOZO_CLEANUP_ORDER_PREFIX
    delete process.env.SHIPMOZO_CLEANUP_CONFIRM
  })

  it('loads config with defaults', () => {
    const cfg = loadCleanupConfig()
    expect(cfg).toEqual({
      fromDate: '',
      toDate: '',
      orderPrefix: '',
      confirm: false,
    })
  })

  it('validates date range', () => {
    expect(() =>
      buildDateRange({
        fromDate: '2026-05-03',
        toDate: '2026-05-01',
        orderPrefix: '',
        confirm: false,
      }),
    ).toThrow('cannot be after')
  })

  it('dry-run does not trigger cancellation', async () => {
    dbRows = [
      {
        id: '1',
        order_number: 'ORD-1',
        awb_number: 'AWB-1',
        shipment_id: 'SHIP-1',
        created_at: new Date('2026-04-30T00:00:00.000Z'),
      },
    ]

    await runCleanup({
      fromDate: '2026-04-30',
      toDate: '2026-04-30',
      orderPrefix: '',
      confirm: false,
    })

    expect(cancelOrderMock).not.toHaveBeenCalled()
  })

  it('confirmed mode cancels eligible rows', async () => {
    dbRows = [
      {
        id: '1',
        order_number: 'ORD-123',
        awb_number: 'AWB-123',
        shipment_id: 'SHIP-123',
        created_at: new Date('2026-04-30T00:00:00.000Z'),
      },
      {
        id: '2',
        order_number: null,
        awb_number: 'AWB-456',
        shipment_id: 'SHIP-456',
        created_at: new Date('2026-04-30T00:00:00.000Z'),
      },
    ]

    cancelOrderMock.mockResolvedValue({ result: 1, message: 'ok' })

    await runCleanup({
      fromDate: '2026-04-30',
      toDate: '2026-04-30',
      orderPrefix: '',
      confirm: true,
    })

    expect(cancelOrderMock).toHaveBeenCalledTimes(2)
    expect(cancelOrderMock).toHaveBeenNthCalledWith(1, {
      order_id: 'SHIP-123',
      awb_number: 'AWB-123',
    })
    expect(cancelOrderMock).toHaveBeenNthCalledWith(2, {
      order_id: 'SHIP-456',
      awb_number: 'AWB-456',
    })
  })
})
