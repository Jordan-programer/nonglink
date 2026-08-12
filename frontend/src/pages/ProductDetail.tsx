import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Leaf, MessageCircle, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ApiError, fetchProduct, startConversation, type Product } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const [contacting, setContacting] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    setStatus('loading')
    fetchProduct(id)
      .then((data) => {
        if (!cancelled) {
          setProduct(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function handleAddToCart() {
    if (!product) return
    addItem(product, quantity)
    setAdded(true)
  }

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="h-80 animate-pulse rounded-3xl bg-leaf-50" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-leaf-50" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-leaf-50" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-leaf-50" />
          </div>
        </div>
      </section>
    )
  }

  if (status === 'error' || !product) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-leaf-950/70">{t('productDetail.notFound')}</p>
        <Link
          to="/mercado"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-leaf-700 hover:text-leaf-800"
        >
          <ArrowLeft size={16} /> {t('productDetail.backToMarket')}
        </Link>
      </section>
    )
  }

  const maxQuantity = Math.max(product.quantity_available, 0)
  const isOwnProduct = user?.id === product.farm_owner_id

  async function handleContact(e: FormEvent) {
    e.preventDefault()
    if (!product || !contactMessage.trim()) return

    if (!token) {
      navigate('/entrar', { state: { from: `/mercado/${product.id}` } })
      return
    }

    setContactSending(true)
    setContactError(null)
    try {
      const conversation = await startConversation(
        {
          recipient_id: product.farm_owner_id,
          product_id: product.id,
          message: contactMessage.trim(),
        },
        token,
      )
      navigate(`/mensagens/${conversation.id}`)
    } catch (err) {
      setContactError(
        err instanceof ApiError ? err.message : 'Não foi possível enviar a mensagem.',
      )
    } finally {
      setContactSending(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <Link
        to="/mercado"
        className="inline-flex items-center gap-2 text-sm font-medium text-leaf-950/60 hover:text-leaf-800"
      >
        <ArrowLeft size={16} /> {t('productDetail.backToMarket')}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-80 w-full rounded-3xl object-cover shadow-lg shadow-leaf-950/10"
          />
        ) : (
          <div className="flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-leaf-500 to-leaf-700 shadow-lg shadow-leaf-950/10">
            <Leaf className="text-white/90" size={64} />
          </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-leaf-950">
              {product.name}
            </h1>
            <span className="whitespace-nowrap rounded-full bg-leaf-100 px-3 py-1 text-xs font-medium capitalize text-leaf-700">
              {product.crop_category}
            </span>
          </div>

          {product.description && (
            <p className="mt-3 text-leaf-950/70">{product.description}</p>
          )}

          <div className="mt-6 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5">
            <p className="text-3xl font-semibold text-leaf-900">
              {product.price_per_unit.toLocaleString('pt-AO')} Kz
              <span className="text-base font-normal text-leaf-950/50">
                {' '}
                / {product.unit}
              </span>
            </p>
            <p className="mt-1 text-sm text-leaf-950/60">
              {product.quantity_available} {product.unit} {t('productDetail.available')}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-leaf-100 px-4 py-3">
            <p className="text-sm text-leaf-950/70">
              Vendido por{' '}
              <span className="font-medium text-leaf-950">{product.farm_owner_name}</span>
              {' · '}
              {product.farm_name}
            </p>
            {!isOwnProduct && !contacting && (
              <button
                onClick={() => setContacting(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-leaf-100 px-3.5 py-2 text-xs font-semibold text-leaf-700 hover:bg-leaf-200"
              >
                <MessageCircle size={14} /> Contactar
              </button>
            )}
          </div>

          {contacting && (
            <form onSubmit={handleContact} className="mt-3 rounded-2xl bg-leaf-50/60 p-4">
              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">
                  Mensagem para {product.farm_owner_name}
                </span>
                <textarea
                  autoFocus
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Olá, este produto ainda está disponível?"
                  className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </label>

              {contactError && (
                <p className="mt-2 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                  {contactError}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={contactSending || !contactMessage.trim()}
                  className="rounded-full bg-leaf-700 px-5 py-2 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                >
                  {contactSending ? 'A enviar...' : 'Enviar mensagem'}
                </button>
                <button
                  type="button"
                  onClick={() => setContacting(false)}
                  className="rounded-full px-5 py-2 text-sm font-medium text-leaf-950/60 hover:bg-leaf-100"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {maxQuantity > 0 ? (
            <div className="mt-6">
              <span className="text-sm font-medium text-leaf-950/80">{t('productDetail.quantity')}</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center rounded-full border border-leaf-200">
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((q) => Math.max(1, q - 1))
                      setAdded(false)
                    }}
                    className="p-2.5 text-leaf-700 hover:bg-leaf-50"
                    aria-label={t('productDetail.decrease')}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-leaf-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity((q) => Math.min(maxQuantity, q + 1))
                      setAdded(false)
                    }}
                    className="p-2.5 text-leaf-700 hover:bg-leaf-50"
                    aria-label={t('productDetail.increase')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-leaf-950/60">{product.unit}</span>
              </div>

              {added && (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-medium text-leaf-800">
                  <CheckCircle2 size={18} /> {t('productDetail.addedToCart')}
                  <Link
                    to="/carrinho"
                    className="ml-auto font-semibold text-leaf-700 hover:text-leaf-800"
                  >
                    {t('productDetail.viewCart')} →
                  </Link>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 transition-colors hover:bg-leaf-800 sm:w-auto"
              >
                <ShoppingCart size={16} /> {t('productDetail.addToCart')}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm font-medium text-earth-700">
              {t('productDetail.outOfStock')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
