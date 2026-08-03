import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createProduct,
  deleteProduct,
  fetchMyFarms,
  fetchMyProducts,
  updateProduct,
  type Farm,
  type Product,
} from '../../api/client'

type FormState = {
  name: string
  description: string
  category: string
  unit: string
  price_per_unit: string
  quantity_available: string
}

const emptyForm: FormState = {
  name: '',
  description: '',
  category: '',
  unit: 'kg',
  price_per_unit: '',
  quantity_available: '',
}

export default function MyProducts() {
  const { token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function loadAll() {
    if (!token) return
    return Promise.all([fetchMyFarms(token), fetchMyProducts(token)]).then(
      ([farmsRes, productsRes]) => {
        setFarms(farmsRes)
        setProducts(productsRes)
        setStatus('ready')
      },
    )
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function startCreate() {
    setForm(emptyForm)
    setError(null)
    setEditingId('new')
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description ?? '',
      category: product.category ?? '',
      unit: product.unit,
      price_per_unit: String(product.price_per_unit),
      quantity_available: String(product.quantity_available),
    })
    setError(null)
    setEditingId(product.id)
  }

  function cancelForm() {
    setEditingId(null)
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      category: form.category || undefined,
      unit: form.unit || 'kg',
      price_per_unit: Number(form.price_per_unit),
      quantity_available: form.quantity_available ? Number(form.quantity_available) : 0,
    }

    try {
      if (editingId === 'new') {
        await createProduct({ ...payload, farm_id: farms[0].id }, token)
      } else if (editingId !== null) {
        await updateProduct(editingId, payload, token)
      }
      setEditingId(null)
      await loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível guardar o produto.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    if (!confirm('Remover este produto do mercado?')) return
    await deleteProduct(id, token)
    await loadAll()
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-earth-200 bg-earth-50 p-6 text-earth-800">
        <p className="font-medium">Ainda não tens uma lavra registada.</p>
        <p className="mt-1 text-sm">
          Cria a tua lavra primeiro para poderes anunciar produtos no mercado.
        </p>
        <Link
          to="/painel/lavra"
          className="mt-4 inline-flex rounded-full bg-earth-600 px-5 py-2 text-sm font-semibold text-white hover:bg-earth-700"
        >
          Criar lavra
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-leaf-950">Os meus produtos</h2>
        {editingId === null && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
          >
            <Plus size={16} /> Novo produto
          </button>
        )}
      </div>

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-leaf-950">
              {editingId === 'new' ? 'Novo produto' : 'Editar produto'}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-leaf-950/50 hover:text-leaf-950"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Nome</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Categoria</span>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: cereais"
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-leaf-950/80">Descrição</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Preço por unidade (Kz)</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_unit}
                onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Unidade</span>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg"
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Quantidade disponível</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.quantity_available}
                onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-earth-100 px-3 py-2 text-sm text-earth-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
          >
            {submitting ? 'A guardar...' : 'Guardar produto'}
          </button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {products.length === 0 && editingId === null && (
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não tens produtos anunciados.
          </div>
        )}

        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-leaf-100 bg-white p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-leaf-950">{product.name}</p>
                {product.category && (
                  <span className="whitespace-nowrap rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-medium text-leaf-700">
                    {product.category}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-leaf-950/60">
                {product.price_per_unit.toLocaleString('pt-AO')} Kz / {product.unit} ·{' '}
                {product.quantity_available} {product.unit} disponíveis
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => startEdit(product)}
                className="rounded-full p-2 text-leaf-700 hover:bg-leaf-100"
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="rounded-full p-2 text-earth-700 hover:bg-earth-50"
                aria-label="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
