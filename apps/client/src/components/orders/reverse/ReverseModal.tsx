import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { quoteReverse } from '../../../api/returns'
import { fetchWalletBalance } from '../../../api/wallet.api'

type ProductLike = {
  name?: string
  productName?: string
  sku?: string
  qty?: number
  quantity?: number
  price?: number
  hsn?: string
  hsnCode?: string
  discount?: number
  tax_rate?: number
  taxRate?: number
}

type OrderForReverse = {
  id: string
  order_number?: string
  weight?: number
  length?: number
  breadth?: number
  height?: number
  integration_type: string
  pickup_details?: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  }
  buyer_name?: string
  buyer_phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  products?: ProductLike[]
}

type ReverseCreatePayload = {
  original_order_id: string
  order_number: string
  payment_type: 'reverse'
  order_amount: number
  order_date: string
  package_length?: number
  package_breadth?: number
  package_height?: number
  shipping_charges: number
  prepaid_amount: number
  is_rto_different: 'no'
  discount: number
  integration_type: string
  transaction_fee: number
  gift_wrap: number
  consignee: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    email: string
    phone: string
  }
  pickup: {
    warehouse_name: string
    address: string
    name: string
    phone: string
    city: string
    state: string
    pincode: string
  }
  order_items: {
    name: string
    sku: string
    qty: number
    price: number
    hsn: string
    discount: number
    tax_rate: number
  }[]
}

interface ReverseModalProps {
  open: boolean
  onClose: () => void
  order: OrderForReverse
  onConfirm: (payload: ReverseCreatePayload) => void
}

export default function ReverseModal({ open, onClose, order, onConfirm }: ReverseModalProps) {
  const [rate, setRate] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<number>(0)
  // weight is shown for reference only; not sent to backend for quoting/creation
  const [eddDays, setEddDays] = useState<number | null>(null)
  const [isOda, setIsOda] = useState<boolean>(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await quoteReverse({ orderId: order.id })
        setRate(Number(res?.quote?.rate || 0))
        setEddDays(res?.quote?.eddDays ?? null)
        setIsOda(Boolean(res?.quote?.oda))
        const wb = await fetchWalletBalance()
        setWallet(Number(wb?.data?.balance || 0))
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to get reverse quote'
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [open, order?.id])

  const confirm = () => {
    const payload: ReverseCreatePayload = {
      original_order_id: order.id,
      order_number: `${order.order_number}-R`,
      payment_type: 'reverse',
      order_amount: 0,
      order_date: new Date().toISOString(),
      // package_weight intentionally not sent for reverse; server uses stored order weight
      package_length: Number(order?.length || 0),
      package_breadth: Number(order?.breadth || 0),
      package_height: Number(order?.height || 0),
      shipping_charges: rate,
      prepaid_amount: 0,
      is_rto_different: 'no',
      discount: 0,
      integration_type: order.integration_type,
      transaction_fee: 0,
      gift_wrap: 0,
      consignee: {
        name: order?.pickup_details?.name || '',
        address: order?.pickup_details?.address || '',
        city: order?.pickup_details?.city || '',
        state: order?.pickup_details?.state || '',
        pincode: order?.pickup_details?.pincode || '',
        email: '',
        phone: order?.pickup_details?.phone || '',
      },
      pickup: {
        warehouse_name: order?.buyer_name || '',
        address: order?.address || '',
        name: order?.buyer_name || '',
        phone: order?.buyer_phone || '',
        city: order?.city || '',
        state: order?.state || '',
        pincode: order?.pincode || '',
      },
      order_items: (Array.isArray(order.products) ? (order.products as ProductLike[]) : []).map(
        (p): ReverseCreatePayload['order_items'][number] => ({
          name: p?.name || p?.productName || 'Item',
          sku: p?.sku || 'NA',
          qty: Number(p?.qty ?? p?.quantity ?? 1),
          price: Number(p?.price ?? 0),
          hsn: p?.hsn || p?.hsnCode || '',
          discount: Number(p?.discount ?? 0),
          tax_rate: Number(p?.tax_rate ?? p?.taxRate ?? 0),
        }),
      ),
    }
    onConfirm(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Reverse Shipment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Reverse will pick up from the customer and deliver to your pickup address.
          </Typography>
          {/* Removed declared weight and dimensions display for reverse */}
          <Box>
            <Typography fontWeight={600}>
              Estimated Reverse Charges: ₹{Number(rate || 0).toFixed(2)}
            </Typography>
            {eddDays !== null && (
              <Typography variant="body2">Estimated Delivery: {eddDays} days</Typography>
            )}
            {isOda && (
              <Typography variant="body2" color="warning.main">
                ODA Area: delivery may take longer and incur surcharges.
              </Typography>
            )}
            {loading && <Typography variant="body2">Fetching quote…</Typography>}
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            {/* weight limit guard removed for reverse flow */}
            {rate > wallet && (
              <Typography color="error" variant="body2">
                Insufficient wallet balance. Required: ₹{rate.toFixed(2)}, Available: ₹
                {wallet.toFixed(2)}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={loading || (!!error && rate === 0) || (rate > 0 && rate > wallet)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
