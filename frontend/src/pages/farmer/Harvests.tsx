import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, Plus, Sprout, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createHarvest,
  fetchCrops,
  fetchMyFarms,
  fetchMyHarvests,
  updateHarvest,
  type Crop,
  type Farm,
  type Harvest,
} from '../../api/client'

const STATUS_STYLES: Record<Harvest['status'], string> = {
  planted: 'bg-earth-100 text-earth-700',
  growing: 'bg-leaf-100 text-leaf-700',
  harvested: 'bg-leaf-200 text-leaf-800',
  cancelled: 'bg-red-100 text-red-700',
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

const emptyForm = {
  crop_id: '',
  planted_at: '',
  expected_harvest_at: '',
  expected_quantity: '',
}

export default function Harvests() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const STATUS_LABELS: Record<Harvest['status'], string> = {
    planted: t('farmerHarvests.statusPlanted'),
    growing: t('farmerHarvests.statusGrowing'),
    harvested: t('farmerHarvests.statusHarvested'),
    cancelled: t('farmerHarvests.statusCancelled'),
  }

  const [farms, setFarms] = useState<Farm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    if (!token) return
    return Promise.all([fetchMyFarms(token), fetchCrops(), fetchMyHarvests(token)]).then(
      ([farmsRes, cropsRes, harvestsRes]) => {
        setFarms(farmsRes)
        setCrops(cropsRes)
        setHarvests(harvestsRes)
        setStatus('ready')
      },
    )
  }

  useEffect(() => {
    load()
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || !farms[0]) return

    setSubmitting(true)
    setError(null)
    try {
      await createHarvest(
        {
          farm_id: farms[0].id,
          crop_id: Number(form.crop_id),
          planted_at: form.planted_at,
          expected_harvest_at: form.expected_harvest_at,
          expected_quantity: form.expected_quantity ? Number(form.expected_quantity) : undefined,
        },
        token,
      )
      setShowForm(false)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('farmerHarvests.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function markHarvested(harvest: Harvest) {
    if (!token) return
    await updateHarvest(
      harvest.id,
      { status: 'harvested', actual_harvest_at: new Date().toISOString().slice(0, 10) },
      token,
    )
    await load()
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
        <p className="font-medium">{t('farmerHarvests.noFarmTitle')}</p>
        <p className="mt-1 text-sm">{t('farmerHarvests.noFarmSubtitle')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-leaf-950">{t('farmerHarvests.title')}</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
          >
            <Plus size={16} /> {t('farmerHarvests.newHarvest')}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-leaf-950">{t('farmerHarvests.newHarvest')}</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-leaf-950/50 hover:text-leaf-950"
              aria-label={t('farmerHarvests.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('farmerHarvests.cropLabel')}</span>
              <select
                required
                value={form.crop_id}
                onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              >
                <option value="" disabled>
                  {t('farmerHarvests.selectCrop')}
                </option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">
                {t('farmerHarvests.expectedQuantityLabel')}
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.expected_quantity}
                onChange={(e) => setForm({ ...form, expected_quantity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('farmerHarvests.plantedAtLabel')}</span>
              <input
                type="date"
                required
                value={form.planted_at}
                onChange={(e) => setForm({ ...form, planted_at: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">
                {t('farmerHarvests.expectedHarvestAtLabel')}
              </span>
              <input
                type="date"
                required
                value={form.expected_harvest_at}
                onChange={(e) => setForm({ ...form, expected_harvest_at: e.target.value })}
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
            {submitting ? t('farmerHarvests.saving') : t('farmerHarvests.save')}
          </button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {harvests.length === 0 && !showForm && (
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('farmerHarvests.noHarvests')}
          </div>
        )}

        {harvests.map((h) => {
          const crop = crops.find((c) => c.id === h.crop_id)
          const days = daysUntil(h.expected_harvest_at)
          const active = h.status === 'planted' || h.status === 'growing'

          return (
            <div
              key={h.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-leaf-100 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-50">
                  <Sprout size={18} className="text-leaf-700" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-leaf-950">
                    {crop?.name ?? t('farmerHarvests.cropFallback', { id: h.crop_id })}
                  </p>
                  <p className="text-sm text-leaf-950/60">
                    {t('farmerHarvests.plantedOn', {
                      date: new Date(h.planted_at).toLocaleDateString('pt-AO'),
                    })}
                    {h.expected_quantity ? ` · ~${h.expected_quantity} kg` : ''}
                  </p>
                  {active && (
                    <p className="text-xs text-leaf-700">
                      {days > 0
                        ? t('farmerHarvests.harvestInDays', { count: days })
                        : days === 0
                          ? t('farmerHarvests.harvestToday')
                          : t('farmerHarvests.harvestOverdue', { count: Math.abs(days) })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[h.status]}`}
                >
                  {STATUS_LABELS[h.status]}
                </span>
                {active && (
                  <button
                    onClick={() => markHarvested(h)}
                    className="flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-200"
                  >
                    <CheckCircle2 size={14} /> {t('farmerHarvests.markHarvested')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
