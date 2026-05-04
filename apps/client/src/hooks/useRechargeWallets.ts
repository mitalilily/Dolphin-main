import { useMutation } from '@tanstack/react-query'
import { confirmRecharge, createRechargeOrder } from '../api/wallet.api'

interface RechargeOptions {
  amount: number
  prefill: {
    name: string
    email: string
    contact: string
  }
}

// Razorpay Checkout types
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

interface RazorpayInstance {
  open: () => void
  on: (event: string, callback: () => void) => void
  close: () => void
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance
}

// Declare Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: RazorpayConstructor
  }
}

export const useRechargeWallet = () =>
  useMutation<void, Error, RechargeOptions>({
    mutationFn: async (options) => {
      // Call backend → get Razorpay order details
      const orderData = await createRechargeOrder({
        amount: options.amount,
        name: options.prefill.name,
        email: options.prefill.email,
        phone: options.prefill.contact,
      })

      if (!orderData?.orderId || !orderData?.key) {
        throw new Error('Invalid Razorpay order response')
      }

      // Initialize Razorpay Checkout
      const options_razorpay: RazorpayCheckoutOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: orderData.name || 'Dolphin Enterprise',
        description: orderData.description || 'Wallet Recharge',
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: orderData.themeColor || '#0052CC' },
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
            // User closed the checkout without paying
            console.log('Payment cancelled by user')
          },
        },
      }

      const razorpay = new window.Razorpay(options_razorpay)
      razorpay.open()
    },
  })
