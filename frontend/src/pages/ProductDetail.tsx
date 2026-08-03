import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Leaf, Minus, Plus } from 'lucide-react'
import { ApiError, createOrder, fetchProduct, type Product } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [ordered, setOrdered] = useState(false)

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

  async function handleOrder() {
    if (!product) return

    if (!token) {
      navigate('/entrar', { state: { from: `/mercado/${product.id}` } })
      return
    }

    setOrdering(true)
    setOrderError(null)
    try {
      await createOrder([{ product_id: product.id, quantity }], token)
      setOrdered(true)
      setProduct({
        ...product,
        quantity_available: product.quantity_available - quantity,
      })
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : 'Não foi possível encomendar.')
    } finally {
      setOrdering(false)
    }
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
        <p className="text-leaf-950/70">
          Não foi possível encontrar este produto.
        </p>
        <Link
          to="/mercado"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-leaf-700 hover:text-leaf-800"
        >
          <ArrowLeft size={16} /> Voltar ao mercado
        </Link>
      </section>
    )
  }

  const maxQuantity = Math.max(product.quantity_available, 0)

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <Link
        to="/mercado"
        className="inline-flex items-center gap-2 text-sm font-medium text-leaf-950/60 hover:text-leaf-800"
      >
        <ArrowLeft size={16} /> Voltar ao mercado
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-leaf-500 to-leaf-700 shadow-lg shadow-leaf-950/10">
          <Leaf className="text-white/90" size={64} />
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-leaf-950">
              {product.name}
            </h1>
            {product.category && (
              <span className="whitespace-nowrap rounded-full bg-leaf-100 px-3 py-1 text-xs font-medium text-leaf-700">
                {product.category}
              </span>
            )}
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
              {product.quantity_available} {product.unit} disponíveis
            </p>
          </div>

          {ordered ? (
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-medium text-leaf-800">
              <CheckCircle2 size={18} /> Encomenda registada com sucesso.
            </div>
          ) : maxQuantity > 0 ? (
            <div className="mt-6">
              <span className="text-sm font-medium text-leaf-950/80">Quantidade</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center rounded-full border border-leaf-200">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-leaf-700 hover:bg-leaf-50"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-leaf-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className="p-2.5 text-leaf-700 hover:bg-leaf-50"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-leaf-950/60">{product.unit}</span>
              </div>

              {orderError && (
                <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                  {orderError}
                </p>
              )}

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="mt-5 w-full rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 transition-colors hover:bg-leaf-800 disabled:opacity-60 sm:w-auto"
              >
                {ordering ? 'A encomendar...' : 'Encomendar agora'}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm font-medium text-earth-700">
              Produto esgotado no momento.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
