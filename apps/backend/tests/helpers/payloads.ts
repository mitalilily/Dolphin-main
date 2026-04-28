import { readJsonFile } from '../utils/file'

export type WarehousePayload = {
  [key: string]: unknown
}

export type OrderPayload = {
  [key: string]: unknown
}

export const loadWarehousePayload = (path: string) => readJsonFile<WarehousePayload>(path)
export const loadOrderPayload = (path: string) => readJsonFile<OrderPayload>(path)
