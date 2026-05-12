import { useMutation } from '@tanstack/react-query'
import { confirmRecharge, createRechargeOrder } from '../api/wallet.api'

interface RechargeOptions {
  amount: number
  prefill: {
    name?: string
    email?: string
    contact?: string
  }
}

type RazorpayPaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi' | 'paylater'

interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: {
    name: string
    email: string
    contact: string
  }
  theme: {
    color: string
  }
  method?: RazorpayPaymentMethod
  retry?: {
    enabled: boolean
  }
  readonly?: {
    name?: boolean
    email?: boolean
    contact?: boolean
  }
  config?: {
    display?: {
      blocks?: Record<
        string,
        {
          name: string
          instruments: Array<{ method: RazorpayPaymentMethod }>
        }
      >
      sequence?: string[]
      preferences?: {
        show_default_blocks?: boolean
      }
    }
  }
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>
  modal: {
    ondismiss: () => void
  }
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayPaymentFailedResponse {
  error?: {
    code?: string
    description?: string
    source?: string
    step?: string
    reason?: string
    metadata?: {
      order_id?: string
      payment_id?: string
    }
  }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, callback: (response?: RazorpayPaymentFailedResponse) => void) => void
  close: () => void
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor
  }
}

interface RazorpayOrderResponse {
  orderId: string
  amount: number
  currency?: string
  key: string
  name?: string
  description?: string
  prefill: RazorpayCheckoutOptions['prefill']
  theme?: {
    color?: string
  }
  themeColor?: string
}

let razorpayScriptPromise: Promise<void> | null = null

const normalisePhoneForRazorpay = (phone?: string) => {
  const raw = String(phone || '').trim()
  if (!raw) return ''

  if (raw.startsWith('+')) return `+${raw.slice(1).replace(/\D/g, '')}`

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return `+${digits}`
}

const normalisePrefill = (
  primary?: Partial<RazorpayCheckoutOptions['prefill']>,
  fallback?: Partial<RazorpayCheckoutOptions['prefill']>,
): RazorpayCheckoutOptions['prefill'] => ({
  name: String(primary?.name || fallback?.name || 'Dolphin Customer').trim(),
  email: String(primary?.email || fallback?.email || '').trim(),
  contact: normalisePhoneForRazorpay(primary?.contact || fallback?.contact),
})

const buildPaymentDisplayConfig = (): NonNullable<RazorpayCheckoutOptions['config']> => ({
  display: {
    blocks: {
      upiPreferred: {
        name: 'Pay by UPI / QR',
        instruments: [{ method: 'upi' }],
      },
      cardPreferred: {
        name: 'Cards',
        instruments: [{ method: 'card' }],
      },
      bankingPreferred: {
        name: 'Netbanking',
        instruments: [{ method: 'netbanking' }],
      },
      walletPreferred: {
        name: 'Wallets',
        instruments: [{ method: 'wallet' }],
      },
    },
    sequence: [
      'block.upiPreferred',
      'block.cardPreferred',
      'block.bankingPreferred',
      'block.walletPreferred',
    ],
    preferences: {
      show_default_blocks: true,
    },
  },
})

const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      razorpayScriptPromise = null
      reject(new Error('Razorpay checkout could not be loaded. Please check your connection.'))
    }
    document.head.appendChild(script)
  })

  return razorpayScriptPromise
}

export const useRechargeWallet = () =>
  useMutation<void, Error, RechargeOptions>({
    mutationFn: async (options) => {
      const requestPrefill = normalisePrefill(options.prefill)
      if (!requestPrefill.email || !requestPrefill.contact) {
        throw new Error('Customer email and phone number are required to open Razorpay payment.')
      }

      const orderData = (await createRechargeOrder({
        amount: options.amount,
        name: requestPrefill.name,
        email: requestPrefill.email,
        phone: requestPrefill.contact,
      })) as RazorpayOrderResponse

      if (!orderData?.orderId || !orderData?.key) {
        throw new Error('Invalid Razorpay order response')
      }
      if (!orderData.key.startsWith('rzp_live_')) {
        throw new Error(
          'Wallet recharge is not configured for live Razorpay payments. Please contact support.',
        )
      }

      await loadRazorpayCheckout()
      const prefill = normalisePrefill(orderData.prefill, requestPrefill)

      const options_razorpay: RazorpayCheckoutOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: orderData.name || 'Dolphin Enterprise',
        description: orderData.description || 'Wallet Recharge',
        order_id: orderData.orderId,
        prefill,
        method: 'upi',
        retry: {
          enabled: true,
        },
        readonly: {
          name: false,
          email: false,
          contact: false,
        },
        config: buildPaymentDisplayConfig(),
        theme: { color: orderData.theme?.color || orderData.themeColor || '#0052CC' },
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            const result = await confirmRecharge({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })

            if (result?.credited) {
              window.location.reload()
              return
            }

            alert(
              'Payment received by Razorpay and is awaiting capture confirmation. Your wallet will update automatically after confirmation.',
            )
          } catch (error) {
            console.error('Payment confirmation error:', error)
            alert('Payment could not be confirmed for wallet credit. Please contact support if money was deducted.')
          }
        },
        modal: {
          ondismiss: function () {
            console.log('Payment cancelled by user')
          },
        },
      }

      const razorpay = new window.Razorpay(options_razorpay)
      razorpay.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response)
        alert(
          response?.error?.description ||
            response?.error?.reason ||
            'Payment failed before completion. Please try another payment method.',
        )
      })
      razorpay.open()
    },
  })
