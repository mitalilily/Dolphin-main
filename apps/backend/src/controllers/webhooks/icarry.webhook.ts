import { createProviderWebhookHandler } from './providerWebhook.factory'

export const icarryWebhookHandler = createProviderWebhookHandler('icarry')

const withIcarryCallbackType = (callbackType: string) => {
  const handler = createProviderWebhookHandler('icarry')

  return (req: any, res: any) => {
    const payload = req.body && typeof req.body === 'object' ? req.body : {}
    req.body = {
      ...payload,
      callback_type: payload.callback_type || payload.callbackType || callbackType,
      __route_callback_type: callbackType,
    }
    return handler(req, res)
  }
}

export const icarryShipmentStatusWebhookHandler = withIcarryCallbackType('sync_status')
export const icarryNdrWebhookHandler = withIcarryCallbackType('ndr_status')
export const icarryWeightDisputeWebhookHandler = withIcarryCallbackType('weight_dispute')
