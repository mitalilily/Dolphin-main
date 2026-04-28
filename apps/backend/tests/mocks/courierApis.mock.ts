import nock from 'nock'
import { qaEnv } from '../config/env'

const asBaseRoot = (url: string) => {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return url
  }
}

export const mockShiprocketSuccess = () => {
  const base = asBaseRoot(qaEnv.shiprocketMockBase)

  nock(base)
    .post('/v1/external/auth/login')
    .reply(200, { token: 'shiprocket-token' })

  nock(base)
    .get('/v1/external/courier/serviceability')
    .query(true)
    .reply(200, {
      status: 200,
      data: {
        available_courier_companies: [
          {
            courier_name: 'Delhivery',
            freight_charge: 92,
            cod_charges: 30,
            etd: '3-4 days',
          },
        ],
      },
    })
}

export const mockShiprocketFailure = (status = 500, message = 'Shiprocket failure') => {
  const base = asBaseRoot(qaEnv.shiprocketMockBase)

  nock(base)
    .post('/v1/external/auth/login')
    .reply(200, { token: 'shiprocket-token' })

  nock(base)
    .get('/v1/external/courier/serviceability')
    .query(true)
    .reply(status, { message })
}

export const mockShiprocketSlow = (delayMs = 35000) => {
  const base = asBaseRoot(qaEnv.shiprocketMockBase)

  nock(base)
    .post('/v1/external/auth/login')
    .reply(200, { token: 'shiprocket-token' })

  nock(base)
    .get('/v1/external/courier/serviceability')
    .query(true)
    .delay(delayMs)
    .reply(200, {
      status: 200,
      data: {
        available_courier_companies: [],
      },
    })
}

export const mockShipmozoSuccess = () => {
  const base = asBaseRoot(qaEnv.shipmozoMockBase)
  nock(base)
    .post('/app/api/v1/rate-calculator')
    .reply(200, {
      result: 1,
      data: [
        {
          courier_id: 101,
          courier_name: 'Shipmozo Express',
          amount: 110,
        },
      ],
    })
}

export const mockIcarrySuccess = () => {
  const base = asBaseRoot(qaEnv.icarryMockBase)

  nock(base)
    .post('/api_login')
    .reply(200, { success: 1, api_token: 'icarry-token' })

  nock(base)
    .post('/api_get_estimate')
    .query({ api_token: 'icarry-token' })
    .reply(200, {
      success: 1,
      estimate: [{ courier: 'iCarry Air', amount: 125 }],
    })
}
