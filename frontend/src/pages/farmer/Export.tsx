import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Ship } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  fetchMyExportBatches,
  fetchMyProducts,
  joinExportBatch,
  type ExportBatch,
  type ExportBatchStatus,
  type Product,
} from '../../api/client'

const STATUS_STYLES: Record<ExportBatchStatus, string> = {
  collecting: 'bg-leaf-100 text-leaf-700',
  certified: 'bg-earth-100 text-earth-700',
  claimed: 'bg-leaf-700 text-white',
}

export default function Export() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<ExportBatch[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const statusLabels: Record<ExportBatchStatus, string> = {
    collecting: t('export.statusCollecting'),
    certified: t('export.statusCertified'),
    claimed: t('export.statusClaimed'),
  }

  function load() {
    if (!token) return
    Promise.all([fetchMyProducts(token), fetchMyExportBatches(token)]).then(
      ([productsData, batchesData]) => {
        setProducts(productsData)
        setBatches(batchesData)
        setStatus('ready')
      },
    )
  }

  useEffect(load, [token])

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!token || !selectedProductId) return
    setError(null)
    setSubmitting(true)
    try {
      await joinExportBatch(
        { product_id: Number(selectedProductId), quantity: Number(quantity) },
        token,
      )
      setSelectedProductId('')
      setQuantity('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('export.joinError'))
    } finally {
      setSubmitting(false)
    }
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

  return (
    <div>
      <div className="flex items-center gap-2">
        <Ship size={20} className="text-leaf-700" />
        <h2 className="text-lg font-semibold text-leaf-950">{t('export.title')}</h2>
      </div>
      <p className="mt-1 text-sm text-leaf-950/60">{t('export.subtitle')}</p>

      <form
        onSubmit={handleJoin}
        className="mt-6 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5"
      >
        <h3 className="text-sm font-semibold text-leaf-950">{t('export.joinTitle')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('export.product')}</span>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            >
              <option value="" disabled>
                {t('export.selectProduct')}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity_available} {p.unit})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('export.quantity')}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
        >
          {submitting ? t('export.joining') : t('export.joinButton')}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-leaf-950">{t('export.myBatches')}</h3>
        {batches.length === 0 ? (
          <p className="mt-3 text-sm text-leaf-950/50">{t('export.noBatches')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {batches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-leaf-950">
                    {b.crop_name} — {b.origin_country_name} → {b.destination_country_name}
                  </p>
                  <p className="mt-1 text-xs text-leaf-950/60">
                    {t('export.volumeProgress', {
                      current: b.total_volume,
                      target: b.min_volume_target,
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                >
                  {statusLabels[b.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
