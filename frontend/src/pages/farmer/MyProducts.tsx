import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createProduct,
  deleteProduct,
  fetchCrops,
  fetchMyFarms,
  fetchMyProducts,
  suggestPrice,
  updateProduct,
  uploadProductImage,
  type Crop,
  type Farm,
  type Product,
  type ProductCertification,
  type ProductQuality,
  type PriceSuggestion,
} from '../../api/client'

type FormState = {
  name: string
  description: string
  image_url: string
  crop_id: string
  unit: string
  price_per_unit: string
  quantity_available: string
  quality: ProductQuality | ''
  certification: ProductCertification
}

const emptyForm: FormState = {
  name: '',
  description: '',
  image_url: '',
  crop_id: '',
  unit: 'kg',
  price_per_unit: '',
  quantity_available: '',
  quality: '',
  certification: 'none',
}

export default function MyProducts() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<number | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const certificationLabels: Record<ProductCertification, string> = {
    none: t('myProducts.certificationNone'),
    organic: t('myProducts.certificationOrganic'),
    in_transition: t('myProducts.certificationInTransition'),
  }

  const confidenceLabels: Record<string, string> = {
    alta: t('myProducts.confidenceHigh'),
    media: t('myProducts.confidenceMedium'),
    baixa: t('myProducts.confidenceLow'),
  }

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

  useEffect(() => {
    fetchCrops().then(setCrops).catch(() => setCrops([]))
  }, [])

  function startCreate() {
    setForm(emptyForm)
    setError(null)
    setSuggestion(null)
    setSuggestionError(null)
    setAppliedSuggestionId(null)
    setEditingId('new')
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description ?? '',
      image_url: product.image_url ?? '',
      crop_id: String(product.crop_id),
      unit: product.unit,
      price_per_unit: String(product.price_per_unit),
      quantity_available: String(product.quantity_available),
      quality: product.quality ?? '',
      certification: product.certification,
    })
    setError(null)
    setSuggestion(null)
    setSuggestionError(null)
    setAppliedSuggestionId(null)
    setEditingId(product.id)
  }

  function cancelForm() {
    setEditingId(null)
    setError(null)
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadProductImage(file, token)
      setForm((prev) => ({ ...prev, image_url: result.image_url }))
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Não foi possível enviar a foto.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSuggestPrice() {
    if (!form.crop_id || farms.length === 0) return
    const farm = farms[0]
    if (!farm.region_id) {
      setSuggestionError(t('myProducts.noRegionError'))
      return
    }

    setSuggesting(true)
    setSuggestionError(null)
    setSuggestion(null)

    try {
      const result = await suggestPrice(
        {
          crop_id: Number(form.crop_id),
          region_id: farm.region_id,
          quality: form.quality || undefined,
          certification: form.certification,
          farm_id: farm.id,
        },
        token ?? undefined,
      )
      if (result.status !== 'ok') {
        setSuggestionError(t('myProducts.suggestInsufficientData'))
      } else {
        setSuggestion(result)
      }
    } catch (err) {
      setSuggestionError(err instanceof ApiError ? err.message : t('myProducts.suggestError'))
    } finally {
      setSuggesting(false)
    }
  }

  function applySuggestion() {
    if (!suggestion || suggestion.suggested_price == null) return
    setForm({ ...form, price_per_unit: String(suggestion.suggested_price) })
    setAppliedSuggestionId(suggestion.suggestion_id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      image_url: form.image_url || undefined,
      crop_id: Number(form.crop_id),
      unit: form.unit || 'kg',
      price_per_unit: Number(form.price_per_unit),
      quantity_available: form.quantity_available ? Number(form.quantity_available) : 0,
      quality: form.quality || undefined,
      certification: form.certification,
      // sent whenever a suggestion was applied, even if the farmer then
      // tweaked the price — the backend compares final vs suggested to
      // decide accepted/adjusted
      price_suggestion_id: appliedSuggestionId ?? undefined,
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
      setError(err instanceof ApiError ? err.message : t('myProducts.error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    if (!confirm(t('myProducts.confirmDelete'))) return
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
        <p className="font-medium">{t('myProducts.noFarmTitle')}</p>
        <p className="mt-1 text-sm">{t('myProducts.noFarmSubtitle')}</p>
        <Link
          to="/painel/lavra"
          className="mt-4 inline-flex rounded-full bg-earth-600 px-5 py-2 text-sm font-semibold text-white hover:bg-earth-700"
        >
          {t('myProducts.createFarm')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-leaf-950">{t('myProducts.title')}</h2>
        {editingId === null && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
          >
            <Plus size={16} /> {t('myProducts.newProduct')}
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
              {editingId === 'new' ? t('myProducts.newProduct') : t('myProducts.editProduct')}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-leaf-950/50 hover:text-leaf-950"
              aria-label={t('myProducts.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4">
            <span className="text-sm font-medium text-leaf-950/80">Foto do produto</span>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-leaf-200 bg-white">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Pré-visualização do produto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus size={22} className="text-leaf-950/30" />
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-leaf-300 bg-white px-4 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">
                {uploading ? 'A enviar...' : form.image_url ? 'Trocar foto' : 'Carregar foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {uploadError && <p className="mt-2 text-sm text-earth-700">{uploadError}</p>}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.name')}</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.crop')}</span>
              <select
                required
                value={form.crop_id}
                onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              >
                <option value="" disabled>
                  {t('myProducts.selectCrop')}
                </option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.description')}</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.quality')}</span>
              <select
                value={form.quality}
                onChange={(e) => setForm({ ...form, quality: e.target.value as ProductQuality | '' })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              >
                <option value="">{t('myProducts.qualityNotDeclared')}</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.certification')}</span>
              <select
                value={form.certification}
                onChange={(e) =>
                  setForm({ ...form, certification: e.target.value as ProductCertification })
                }
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              >
                {Object.entries(certificationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.pricePerUnit')}</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_unit}
                onChange={(e) => {
                  setForm({ ...form, price_per_unit: e.target.value })
                  setAppliedSuggestionId(null)
                }}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.unit')}</span>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder={t('myProducts.unitPlaceholder')}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('myProducts.quantityAvailable')}</span>
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

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSuggestPrice}
              disabled={!form.crop_id || suggesting}
              className="flex items-center gap-1.5 rounded-full border border-leaf-300 bg-white px-4 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50 disabled:opacity-50"
            >
              <Sparkles size={15} />
              {suggesting ? t('myProducts.calculatingSuggestion') : t('myProducts.suggestPrice')}
            </button>

            {suggestionError && (
              <p className="mt-2 text-sm text-leaf-950/60">{suggestionError}</p>
            )}

            {suggestion && suggestion.suggested_price != null && (
              <div className="mt-3 rounded-xl border border-leaf-200 bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-semibold text-leaf-950">
                    {suggestion.suggested_price.toLocaleString('pt-AO')} Kz
                  </p>
                  <span className="text-xs font-medium text-leaf-950/60">
                    {t('myProducts.confidence')} {confidenceLabels[suggestion.confidence ?? ''] ?? '—'}
                  </span>
                </div>
                {suggestion.range_low != null && suggestion.range_high != null && (
                  <p className="mt-0.5 text-xs text-leaf-950/60">
                    {t('myProducts.range')} {suggestion.range_low.toLocaleString('pt-AO')} –{' '}
                    {suggestion.range_high.toLocaleString('pt-AO')} Kz
                  </p>
                )}
                {suggestion.factors.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-leaf-950/70">
                    {suggestion.factors.map((f, i) => (
                      <li key={i}>
                        {f.label}: {f.delta_pct > 0 ? '+' : ''}
                        {f.delta_pct.toFixed(1)}%
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="mt-3 rounded-full bg-leaf-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-leaf-800"
                >
                  {t('myProducts.useThisPrice')}
                </button>
              </div>
            )}
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
            {submitting ? t('myProducts.saving') : t('myProducts.saveProduct')}
          </button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {products.length === 0 && editingId === null && (
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('myProducts.noProductsYet')}
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
                <span className="whitespace-nowrap rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-medium text-leaf-700">
                  {product.crop_name}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-leaf-950/60">
                {product.price_per_unit.toLocaleString('pt-AO')} Kz / {product.unit} ·{' '}
                {product.quantity_available} {product.unit} {t('myProducts.available')}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => startEdit(product)}
                className="rounded-full p-2 text-leaf-700 hover:bg-leaf-100"
                aria-label={t('myProducts.edit')}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="rounded-full p-2 text-earth-700 hover:bg-earth-50"
                aria-label={t('myProducts.remove')}
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
