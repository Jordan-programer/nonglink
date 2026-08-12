import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, createOrder } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!token) {
      navigate('/entrar', { state: { from: '/carrinho' } })
      return
    }

    setCheckingOut(true)
    setError(null)
    try {
      await createOrder(
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        token,
      )
      clearCart()
      navigate('/minhas-encomendas')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cart.checkoutError'))
    } finally {
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <ShoppingCart className="mx-auto mb-3 text-leaf-700/40" size={40} />
        <p className="text-leaf-950/70">{t('cart.empty')}</p>
        <Link
          to="/mercado"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-leaf-700 hover:text-leaf-800"
        >
          {t('cart.continueShopping')}
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">{t('cart.title')}</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-leaf-100 bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-leaf-950">{item.name}</p>
              <p className="text-xs text-leaf-950/60">{item.farm_name}</p>
              <p className="mt-1 text-sm text-leaf-900">
                {item.price_per_unit.toLocaleString('pt-AO')} Kz / {item.unit}
              </p>
            </div>

            <div className="flex items-center rounded-full border border-leaf-200">
              <button
                type="button"
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="p-2 text-leaf-700 hover:bg-leaf-50"
                aria-label={t('cart.decrease')}
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-leaf-950">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                disabled={item.quantity >= item.quantity_available}
                className="p-2 text-leaf-700 hover:bg-leaf-50 disabled:opacity-40"
                aria-label={t('cart.increase')}
              >
                <Plus size={14} />
              </button>
            </div>

            <p className="w-24 shrink-0 text-right text-sm font-semibold text-leaf-900">
              {(item.quantity * item.price_per_unit).toLocaleString('pt-AO')} Kz
            </p>

            <button
              onClick={() => removeItem(item.product_id)}
              className="shrink-0 rounded-full p-2 text-earth-700 hover:bg-earth-50"
              aria-label={t('cart.remove')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5">
        <span className="text-sm font-medium text-leaf-950/80">{t('cart.total')}</span>
        <span className="text-xl font-semibold text-leaf-900">
          {totalAmount.toLocaleString('pt-AO')} Kz
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 hover:bg-leaf-800 disabled:opacity-60"
        >
          {checkingOut ? t('cart.checkingOut') : t('cart.checkout')}
        </button>
        <button
          onClick={clearCart}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-leaf-950/60 hover:bg-leaf-100"
        >
          {t('cart.clearCart')}
        </button>
      </div>
    </section>
  )
}
