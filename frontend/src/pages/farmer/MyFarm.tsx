import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Sprout } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createFarm,
  fetchCountries,
  fetchMyFarms,
  fetchRegions,
  updateFarm,
  type Country,
  type Farm,
  type Region,
} from '../../api/client'

export default function MyFarm() {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sizeHectares, setSizeHectares] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [countryId, setCountryId] = useState('')
  const [regions, setRegions] = useState<Region[]>([])
  const [regionId, setRegionId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const filteredRegions = useMemo(
    () => regions.filter((r) => String(r.country_id) === countryId),
    [regions, countryId],
  )

  useEffect(() => {
    Promise.all([fetchCountries(), fetchRegions()]).then(([countriesData, regionsData]) => {
      setCountries(countriesData)
      setRegions(regionsData)
    })
  }, [])

  useEffect(() => {
    if (!token || regions.length === 0) return
    fetchMyFarms(token).then((farms) => {
      const existing = farms[0] ?? null
      setFarm(existing)

      const initialRegionId = existing?.region_id ?? user?.region_id ?? null
      if (initialRegionId) {
        const region = regions.find((r) => r.id === initialRegionId)
        setCountryId(region ? String(region.country_id) : '')
        setRegionId(String(initialRegionId))
      }
      if (existing) {
        setName(existing.name)
        setLocation(existing.location ?? '')
        setSizeHectares(existing.size_hectares?.toString() ?? '')
      }
      setStatus('ready')
    })
  }, [token, user, regions])

  function handleCountryChange(value: string) {
    setCountryId(value)
    setRegionId('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    setError(null)
    setSaved(false)
    setSubmitting(true)

    const payload = {
      name,
      location: location || undefined,
      size_hectares: sizeHectares ? Number(sizeHectares) : undefined,
      region_id: regionId ? Number(regionId) : undefined,
    }

    try {
      const result = farm
        ? await updateFarm(farm.id, payload, token)
        : await createFarm(payload, token)
      setFarm(result)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('myFarm.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <div className="h-64 animate-pulse rounded-2xl bg-leaf-50" />
  }

  return (
    <div className="rounded-2xl border border-leaf-100 bg-white p-6">
      <div className="flex items-center gap-2 text-leaf-800">
        <Sprout size={18} />
        <h2 className="text-lg font-semibold text-leaf-950">
          {farm ? t('myFarm.titleExisting') : t('myFarm.titleNew')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-leaf-950/60">
        {farm ? t('myFarm.subtitleExisting') : t('myFarm.subtitleNew')}
      </p>

      <form className="mt-6 max-w-md space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">{t('myFarm.name')}</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('myFarm.namePlaceholder')}
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">{t('myFarm.location')}</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('myFarm.locationPlaceholder')}
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('myFarm.country')}</span>
            <select
              required
              value={countryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            >
              <option value="" disabled>
                {t('myFarm.selectOption')}
              </option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('myFarm.region')}</span>
            <select
              required
              value={regionId}
              disabled={!countryId}
              onChange={(e) => setRegionId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>
                {t('myFarm.selectOption')}
              </option>
              {filteredRegions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">{t('myFarm.sizeHectares')}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={sizeHectares}
            onChange={(e) => setSizeHectares(e.target.value)}
            placeholder={t('myFarm.sizeHectaresPlaceholder')}
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
        )}
        {saved && (
          <p className="rounded-lg bg-leaf-100 px-3 py-2 text-sm text-leaf-800">
            {t('myFarm.savedSuccess')}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-leaf-800 disabled:opacity-60"
        >
          {submitting ? t('myFarm.saving') : farm ? t('myFarm.saveChanges') : t('myFarm.createFarm')}
        </button>
      </form>
    </div>
  )
}
