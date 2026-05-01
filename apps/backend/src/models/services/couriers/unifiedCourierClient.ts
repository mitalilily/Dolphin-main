import { HttpError } from '../../../utils/classes'
import { IcarryService } from './icarry.service'
import { ShipmozoService } from './shipmozo.service'
import { ShiprocketCourierService } from './shiprocket.service'
import { TruxcargoService } from './truxcargo.service'

export type UnifiedCourierProvider = 'shiprocket' | 'shipmozo' | 'icarry' | 'truxcargo'

export interface UnifiedCourierClient {
  createShipment(orderData: Record<string, any>): Promise<any>
  trackShipment(trackingId: string | number): Promise<any>
  cancelShipment(shipmentId: string | number): Promise<any>
  getRates(input: Record<string, any>): Promise<any>
  schedulePickup(input: Record<string, any>): Promise<any>
}

class ShiprocketUnifiedClient implements UnifiedCourierClient {
  private readonly service = new ShiprocketCourierService()

  createShipment(orderData: Record<string, any>) {
    return this.service.createCustomOrder(orderData || {})
  }

  trackShipment(trackingId: string | number) {
    return this.service.trackByAwb(String(trackingId || ''))
  }

  cancelShipment(shipmentId: string | number) {
    return this.service.cancelOrders({ ids: [String(shipmentId || '')] })
  }

  getRates(input: Record<string, any>) {
    return this.service.checkCourierServiceability(input || {})
  }

  schedulePickup(input: Record<string, any>) {
    return this.service.generatePickup(input || {})
  }
}

class ShipmozoUnifiedClient implements UnifiedCourierClient {
  private readonly service = new ShipmozoService()

  createShipment(orderData: Record<string, any>) {
    return this.service.pushOrder(orderData as any)
  }

  trackShipment(trackingId: string | number) {
    return this.service.trackOrder(String(trackingId || ''))
  }

  cancelShipment(shipmentId: string | number) {
    return Promise.reject(
      new HttpError(
        501,
        'NEEDS MANUAL REVIEW: Shipmozo cancel-order requires both order_id and awb_number; unified shipmentId mapping is ambiguous.',
      ),
    )
  }

  getRates(input: Record<string, any>) {
    return this.service.rateCalculator(input as any)
  }

  schedulePickup(input: Record<string, any>) {
    return this.service.schedulePickup(input as any)
  }
}

class IcarryUnifiedClient implements UnifiedCourierClient {
  private readonly service = new IcarryService()

  createShipment(orderData: Record<string, any>) {
    if (orderData?.mode === 'international') {
      return this.service.bookInternationalShipment(orderData as any)
    }
    throw new HttpError(
      501,
      'NEEDS MANUAL REVIEW: iCarry domestic create-shipment endpoint is not documented in current codebase.',
    )
  }

  trackShipment(trackingId: string | number) {
    return this.service.trackShipment({ shipment_id: trackingId })
  }

  cancelShipment(shipmentId: string | number) {
    return this.service.cancelShipment({ shipment_id: shipmentId })
  }

  getRates(input: Record<string, any>) {
    return this.service.getEstimateSingleShipment(input as any)
  }

  schedulePickup(_input: Record<string, any>) {
    return Promise.reject(
      new HttpError(
        501,
        'NEEDS MANUAL REVIEW: iCarry pickup scheduling endpoint is not documented in current codebase.',
      ),
    )
  }
}

class TruxcargoUnifiedClient implements UnifiedCourierClient {
  private readonly service = new TruxcargoService()

  createShipment(orderData: Record<string, any>) {
    return this.service.createOrder(orderData || {})
  }

  trackShipment(trackingId: string | number) {
    return this.service.trackShipment({ waybill: String(trackingId || '') })
  }

  cancelShipment(shipmentId: string | number) {
    return this.service.cancelOrder({ waybill: String(shipmentId || '') })
  }

  getRates(input: Record<string, any>) {
    return this.service.getShippingCharge(input || {})
  }

  schedulePickup(_input: Record<string, any>) {
    return Promise.reject(
      new HttpError(
        501,
        'NEEDS MANUAL REVIEW: Truxcargo pickup scheduling endpoint is not documented in current codebase.',
      ),
    )
  }
}

export const getUnifiedCourierClient = (provider: UnifiedCourierProvider): UnifiedCourierClient => {
  if (provider === 'shiprocket') return new ShiprocketUnifiedClient()
  if (provider === 'shipmozo') return new ShipmozoUnifiedClient()
  if (provider === 'truxcargo') return new TruxcargoUnifiedClient()
  return new IcarryUnifiedClient()
}
