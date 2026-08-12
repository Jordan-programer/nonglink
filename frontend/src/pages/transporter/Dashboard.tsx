import { useEffect, useState } from 'react'
import { ArrowRight, MapPin, Package, Phone, Plus, Trash2, TrendingUp, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  claimDelivery,
  createRoute,
  deleteRoute,
  fetchAvailableDeliveries,
  fetchCountries,
  fetchDeliveriesTrends,
  fetchMyDeliveries,
  fetchMyRoutes,
  fetchPopularRoutes,
  fetchRegions,
  updateDeliveryStatus,
  type Country,
  type PopularRoute,
  type Region,
  type TransportOrder,
  type TransportRoute,
  type TrendPoint,
} from '../../api/client'
import { STATUS_STYLES, useOrderStatusLabels } from '../../utils/orderStatus'
import StatTile from '../../components/StatTile'
import TrendChartCard from '../../components/TrendChartCard'

export default function TransporterDashboard() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const statusLabels = useOrderStatusLabels()

  const [available, setAvailable] = useState<TransportOrder[]>([])
  const [mine, setMine] = useState<TransportOrder[]>([])
  const [deliveriesTrend, setDeliveriesTrend] = useState<TrendPoint[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [myRoutes, setMyRoutes] = useState<TransportRoute[]>([])
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([])
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [originId, setOriginId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [routeError, setRouteError] = useState<string | null>(null)
  const [savingRoute, setSavingRoute] = useState(false)

  function load() {
    if (!token) return
    return Promise.all([
      fetchAvailableDeliveries(token),
      fetchMyDeliveries(token),
      fetchDeliveriesTrends(token),
    ]).then(([availableRes, mineRes, trendRes]) => {
      setAvailable(availableRes)
      setMine(mineRes)
      setDeliveriesTrend(trendRes)
      setStatus('ready')
    })
  }

  function loadRoutes() {
    if (!token) return
    return Promise.all([fetchMyRoutes(token), fetchPopularRoutes(token)]).then(
      ([mineRes, popularRes]) => {
        setMyRoutes(mineRes)
        setPopularRoutes(popularRes)
      },
    )
  }

  useEffect(() => {
    load()
    loadRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    Promise.all([fetchCountries(), fetchRegions()]).then(([countriesRes, regionsRes]) => {
      setCountries(countriesRes)
      setRegions(regionsRes)
    })
  }, [])

  async function handleAddRoute(originRegionId: number, destinationRegionId: number) {
    if (!token) return
    setRouteError(null)
    setSavingRoute(true)
    try {
      await createRoute(
        { origin_region_id: originRegionId, destination_region_id: destinationRegionId },
        token,
      )
      setShowRouteForm(false)
      setOriginId('')
      setDestinationId('')
      await loadRoutes()
    } catch (err) {
      setRouteError(err instanceof ApiError ? err.message : t('transporterDashboard.addRouteError'))
    } finally {
      setSavingRoute(false)
    }
  }

  async function handleDeleteRoute(routeId: number) {
    if (!token) return
    await deleteRoute(routeId, token)
    await loadRoutes()
  }

  async function handleClaim(orderId: number) {
    if (!token) return
    setError(null)
    setSavingId(orderId)
    try {
      await claimDelivery(orderId, token)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('transporterDashboard.claimError'))
    } finally {
      setSavingId(null)
    }
  }

  async function handleAdvance(order: TransportOrder) {
    if (!token) return
    const nextStatus = order.status === 'confirmed' ? 'shipped' : 'delivered'
    setError(null)
    setSavingId(order.id)
    try {
      await updateDeliveryStatus(order.id, nextStatus, token)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('transporterDashboard.advanceError'))
    } finally {
      setSavingId(null)
    }
  }

  const activeDeliveries = mine.filter((o) => o.status === 'confirmed' || o.status === 'shipped')
  const pastDeliveries = mine.filter((o) => o.status === 'delivered')

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
        {t('transporterDashboard.greeting')} <span className="text-leaf-700">{user?.name.split(' ')[0]}</span>
      </h1>
      <p className="mt-1 text-sm text-leaf-950/60">{t('transporterDashboard.subtitle')}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={Package} label={t('transporterDashboard.statAvailable')} value={available.length} />
        <StatTile
          icon={Truck}
          label={t('transporterDashboard.statActiveDeliveries')}
          value={activeDeliveries.length}
          trendSeries={deliveriesTrend}
        />
        <StatTile icon={Package} label={t('transporterDashboard.statDelivered')} value={pastDeliveries.length} />
      </div>

      <div className="mt-6">
        <TrendChartCard
          title={t('transporterDashboard.trendTitle')}
          subtitle={t('transporterDashboard.trendSubtitle')}
          series={deliveriesTrend}
          kind="bar"
        />
      </div>

      {/* Available pool */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-leaf-950">{t('transporterDashboard.availableTitle')}</h2>
        {available.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('transporterDashboard.noAvailable')}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {available.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-leaf-950">
                    {t('transporterDashboard.orderNumber', { id: order.id })}
                  </p>
                  <p className="text-xs text-leaf-950/60">
                    {order.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-leaf-950/60">
                    {t('transporterDashboard.forBuyer', { name: order.buyer_name })}
                    {order.buyer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {order.buyer_phone}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-leaf-900">
                    {order.total_amount.toLocaleString('pt-AO')} Kz
                  </span>
                  <button
                    onClick={() => handleClaim(order.id)}
                    disabled={savingId === order.id}
                    className="rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                  >
                    {t('transporterDashboard.acceptDelivery')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My deliveries */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-leaf-950">{t('transporterDashboard.myDeliveriesTitle')}</h2>
        {mine.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('transporterDashboard.noMyDeliveries')}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {mine.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-leaf-950">
                      {t('transporterDashboard.orderNumber', { id: order.id })}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-leaf-950/60">
                    {order.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-leaf-950/60">
                    {t('transporterDashboard.forBuyer', { name: order.buyer_name })}
                    {order.buyer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {order.buyer_phone}
                      </span>
                    )}
                  </p>
                </div>
                {(order.status === 'confirmed' || order.status === 'shipped') && (
                  <button
                    onClick={() => handleAdvance(order)}
                    disabled={savingId === order.id}
                    className="rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                  >
                    {order.status === 'confirmed'
                      ? t('transporterDashboard.markShipped')
                      : t('transporterDashboard.markDelivered')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Popular routes */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <TrendingUp size={18} className="text-leaf-700" /> {t('transporterDashboard.popularRoutesTitle')}
        </h2>
        <p className="mt-1 text-sm text-leaf-950/60">{t('transporterDashboard.popularRoutesSubtitle')}</p>

        {popularRoutes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('transporterDashboard.noPopularRoutes')}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {popularRoutes.map((r) => {
              const alreadyAdded = myRoutes.some(
                (mr) =>
                  mr.origin_region_id === r.origin_region_id &&
                  mr.destination_region_id === r.destination_region_id,
              )
              return (
                <div
                  key={`${r.origin_region_id}-${r.destination_region_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-leaf-950">
                    <MapPin size={14} className="text-leaf-700" />
                    {r.origin_region_name}
                    <ArrowRight size={14} className="text-leaf-950/40" />
                    {r.destination_region_name}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-medium text-leaf-700">
                      {t('transporterDashboard.orderCount', { count: r.order_count })}
                    </span>
                    <button
                      onClick={() => handleAddRoute(r.origin_region_id, r.destination_region_id)}
                      disabled={alreadyAdded || savingRoute}
                      className="rounded-full border border-leaf-300 px-3 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-50 disabled:opacity-50"
                    >
                      {alreadyAdded ? t('transporterDashboard.alreadyAdded') : t('transporterDashboard.add')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My routes */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-leaf-950">{t('transporterDashboard.myRoutesTitle')}</h2>
          {!showRouteForm && (
            <button
              onClick={() => setShowRouteForm(true)}
              className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
            >
              <Plus size={16} /> {t('transporterDashboard.newRoute')}
            </button>
          )}
        </div>

        {showRouteForm && (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">{t('transporterDashboard.origin')}</span>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                >
                  <option value="" disabled>
                    {t('transporterDashboard.select')}
                  </option>
                  {countries.map((c) => (
                    <optgroup key={c.id} label={c.name}>
                      {regions
                        .filter((r) => r.country_id === c.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">{t('transporterDashboard.destination')}</span>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                >
                  <option value="" disabled>
                    {t('transporterDashboard.select')}
                  </option>
                  {countries.map((c) => (
                    <optgroup key={c.id} label={c.name}>
                      {regions
                        .filter((r) => r.country_id === c.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            </div>

            {routeError && (
              <p className="mt-3 rounded-lg bg-earth-100 px-3 py-2 text-sm text-earth-800">
                {routeError}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  if (originId && destinationId) {
                    handleAddRoute(Number(originId), Number(destinationId))
                  }
                }}
                disabled={!originId || !destinationId || savingRoute}
                className="rounded-full bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
              >
                {savingRoute ? t('transporterDashboard.saving') : t('transporterDashboard.saveRoute')}
              </button>
              <button
                onClick={() => setShowRouteForm(false)}
                className="text-sm font-medium text-leaf-950/60 hover:text-leaf-950"
              >
                {t('transporterDashboard.cancel')}
              </button>
            </div>
          </div>
        )}

        {myRoutes.length === 0 && !showRouteForm ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('transporterDashboard.noMyRoutes')}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {myRoutes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-leaf-950">
                  <MapPin size={14} className="text-leaf-700" />
                  {r.origin_region_name}
                  <ArrowRight size={14} className="text-leaf-950/40" />
                  {r.destination_region_name}
                </div>
                <button
                  onClick={() => handleDeleteRoute(r.id)}
                  className="rounded-full p-2 text-earth-700 hover:bg-earth-50"
                  aria-label={t('transporterDashboard.removeRoute')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
