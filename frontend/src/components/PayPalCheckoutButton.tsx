import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capturePayPalOrder, createPayPalOrder, fetchPayPalClientId } from '../api/client'

declare global {
  interface Window {
    paypal?: {
      createInstance: (options: {
        clientId: string
        components: string[]
        pageType: string
      }) => Promise<PayPalSdkInstance>
    }
  }
}

type PayPalSdkInstance = {
  findEligibleMethods: (options: { currencyCode: string }) => Promise<{
    isEligible: (method: string) => boolean
  }>
  createPayPalOneTimePaymentSession: (options: {
    onApprove: (data: { orderId: string }) => void | Promise<void>
    onCancel: (data: { orderId?: string }) => void
    onError: (error: Error) => void
  }) => PayPalPaymentSession
}

type PayPalPaymentSession = {
  start: (
    options: { presentationMode: 'auto' },
    createOrderPromise: Promise<{ orderId: string }>,
  ) => Promise<void>
}

let sdkLoadPromise: Promise<void> | null = null

function loadPayPalSdk(sdkUrl: string): Promise<void> {
  if (window.paypal) return Promise.resolve()
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = sdkUrl
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
      document.body.appendChild(script)
    })
  }
  return sdkLoadPromise
}

type Status = 'loading' | 'ready' | 'unavailable'

export default function PayPalCheckoutButton({
  orderId,
  token,
  onSuccess,
  onError,
}: {
  orderId: number
  token: string
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('loading')
  const sessionRef = useRef<PayPalPaymentSession | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { client_id, sdk_url } = await fetchPayPalClientId()
        await loadPayPalSdk(sdk_url)
        if (cancelled || !window.paypal) return

        const sdkInstance = await window.paypal.createInstance({
          clientId: client_id,
          components: ['paypal-payments'],
          pageType: 'checkout',
        })

        const eligibleMethods = await sdkInstance.findEligibleMethods({ currencyCode: 'USD' })
        if (!eligibleMethods.isEligible('paypal')) {
          if (!cancelled) setStatus('unavailable')
          return
        }

        sessionRef.current = sdkInstance.createPayPalOneTimePaymentSession({
          async onApprove(data) {
            try {
              await capturePayPalOrder(data.orderId, token)
              onSuccess()
            } catch (err) {
              onError(err instanceof Error ? err.message : t('cart.paypalCaptureError'))
            }
          },
          onCancel() {},
          onError(err) {
            onError(err.message)
          },
        })

        if (!cancelled) setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setStatus('unavailable')
          onError(err instanceof Error ? err.message : t('cart.paypalInitError'))
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [token, onSuccess, onError, t])

  async function handleClick() {
    if (!sessionRef.current) return
    try {
      const createOrderPromise = createPayPalOrder(orderId, token).then((o) => ({
        orderId: o.id,
      }))
      await sessionRef.current.start({ presentationMode: 'auto' }, createOrderPromise)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('cart.paypalStartError'))
    }
  }

  if (status === 'unavailable') {
    return <p className="text-sm text-earth-700">{t('cart.paypalUnavailable')}</p>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'loading'}
      className="w-full rounded-full bg-[#0070ba] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005ea6] disabled:opacity-60"
    >
      {status === 'loading' ? t('cart.paypalLoading') : t('cart.payWithPaypal')}
    </button>
  )
}
