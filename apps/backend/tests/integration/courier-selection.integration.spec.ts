import { AxiosError } from 'axios'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'

describeLive('E. COURIER SELECTION', () => {
  it('valid available-courier selection payload should succeed', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const response = await api.post(
      '/api/couriers/available',
      {
        origin: '560001',
        destination: '400001',
        payment_type: 'prepaid',
        weight: 1,
        order_amount: 1000,
      },
      { headers: authHeaders(token) },
    )

    expect([200]).toContain(response.status)

    const first = response.data?.data?.[0]
    if (first) {
      scenarioContext.selectedCourierId = first.courier_id || first.id
    }
  })

  it('selecting unavailable courier should fail', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const error = await api
      .post(
        '/api/orders/b2c/create',
        {
          order_number: `QA-UNAVAILABLE-${Date.now()}`,
          courier_id: 99999999,
          weight: 1,
          length: 10,
          breadth: 10,
          height: 10,
          payment_type: 'prepaid',
          consignee: {
            name: 'Receiver',
            phone: '9123456789',
            address: 'X',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
          pickup_location: {
            name: 'Warehouse',
            phone: '9876543210',
            address: 'Y',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          order_items: [{ name: 'Item', quantity: 1, price: 100 }],
        },
        { headers: authHeaders(token) },
      )
      .catch((err: AxiosError) => err)

    expect([400, 404, 422]).toContain(error.response?.status as number)
  })
})
