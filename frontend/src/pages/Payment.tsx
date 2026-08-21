import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ApiError,
  fetchMyPaymentMethods,
  fetchOrder,
  setOrderPaymentMethod,
  type Order,
  type PaymentMethod,
} from '../api/client'
import { useAuth } from '../context/AuthContext'
import PayPalCheckoutButton from '../components/PayPalCheckoutButton'

const PAYMENT_METHOD_IMAGE_FILES: Record<string, string> = {
  multicaixa_express: 'multicaixa-express.png',
  alipay: 'Alipay_logo_(2024).png',
  wechat_pay: 'wechat-pay.png',
  unionpay: 'UnionPay_logo.png',
  airtel_money: 'airtel-money.png',
  mtn_momo: 'mtn-mobile-money.png',
  orange_money: 'orange-money.png',
  mpesa: 'M-pesa-logo.png',
  paypal: 'paypal.png',
  unitel_money: 'unitel-money.png',
}

function paymentMethodImage(code: string): string | null {
  const file = PAYMENT_METHOD_IMAGE_FILES[code]
  return file ? `/payments%20methods/${encodeURIComponent(file)}` : null
}

export default function Payment() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { orderId } = useParams()
  const { token } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !orderId) return
    let cancelled = false

    Promise.all([fetchOrder(Number(orderId), token), fetchMyPaymentMethods(token)])
      .then(([orderRes, methodsRes]) => {
        if (cancelled) return
        setOrder(orderRes)
        setMethods(methodsRes)
        setSelectedId(orderRes.payment_method?.id ?? null)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('not-found')
      })

    return () => {
      cancelled = true
    }
  }, [orderId, token])

  const selectedMethod = methods.find((m) => m.id === selectedId)
  const isPayPal = selectedMethod?.code === 'paypal'
  const alreadyPaid = order?.payment_status === 'paid'

  async function handleSelect(method: PaymentMethod) {
    setSelectedId(method.id)
    setSaved(false)
    setError(null)
    if (!order || !token) return

    setSaving(true)
    try {
      const updated = await setOrderPaymentMethod(order.id, method.id, token)
      setOrder(updated)
      if (method.code !== 'paypal') setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('payment.saveError'))
    } finally {
      setSaving(false)
    }
  }

  function handlePayPalSuccess() {
    navigate('/minhas-encomendas')
  }

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-2xl px-6 py-14">
        <div className="h-64 animate-pulse rounded-2xl bg-leaf-50" />
      </section>
    )
  }

  if (status === 'not-found' || !order) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-leaf-950/70">{t('payment.orderNotFound')}</p>
        <Link
          to="/minhas-encomendas"
          className="mt-4 inline-flex text-sm font-medium text-leaf-700 hover:text-leaf-800"
        >
          {t('payment.viewOrders')}
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">{t('payment.title')}</h1>
      <p className="mt-1 text-sm text-leaf-950/60">
        {t('payment.subtitle', {
          id: order.id,
          total: order.total_amount.toLocaleString('pt-AO'),
        })}
      </p>

      {alreadyPaid ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-medium text-leaf-800">
          <CheckCircle2 size={18} /> {t('payment.alreadyPaid')}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {methods.map((method) => {
              const image = paymentMethodImage(method.code)
              const selected = selectedId === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleSelect(method)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                    selected
                      ? 'border-leaf-600 bg-leaf-50'
                      : 'border-leaf-100 bg-white hover:bg-leaf-50/60'
                  }`}
                >
                  {image ? (
                    <img src={image} alt={method.name} className="h-10 object-contain" />
                  ) : (
                    <CreditCard size={28} className="text-leaf-700" />
                  )}
                  <span className="text-center text-xs font-semibold text-leaf-950">
                    {method.name}
                  </span>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
          )}

          {isPayPal ? (
            <div className="mt-6 max-w-xs">
              <p className="mb-3 text-sm text-leaf-950/70">{t('cart.completePaypalPayment')}</p>
              <PayPalCheckoutButton
                orderId={order.id}
                token={token!}
                onSuccess={handlePayPalSuccess}
                onError={setError}
              />
            </div>
          ) : (
            saved && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-medium text-leaf-800">
                <CheckCircle2 size={18} /> {t('payment.methodSaved')}
              </div>
            )
          )}

          {saving && <p className="mt-3 text-sm text-leaf-950/60">{t('payment.saving')}</p>}

          <Link
            to="/minhas-encomendas"
            className="mt-6 inline-flex text-sm font-medium text-leaf-700 hover:text-leaf-800"
          >
            {t('payment.viewOrders')} →
          </Link>
        </>
      )}
    </section>
  )
}
