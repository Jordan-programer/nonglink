import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  FileText,
  MapPin,
  Package,
  Percent,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  claimDelivery,
  completeDeliveryStop,
  createRoute,
  deleteRoute,
  fetchAvailableDeliveries,
  fetchCountries,
  fetchDeliveriesTrends,
  fetchMyDeliveries,
  fetchMyRoutes,
  fetchMyTransporterProfile,
  fetchOrderTracking,
  fetchPopularRoutes,
  fetchRegions,
  fetchTransportEarnings,
  setAvailability,
  updateDeliveryStatus,
  updateTransporterLocation,
  type Country,
  type EarningsSummary,
  type OrderTracking,
  type PopularRoute,
  type Region,
  type TransporterProfile,
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
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
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

  const [transporterProfile, setTransporterProfile] = useState<TransporterProfile | null>(null)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null)
  const [completingStopId, setCompletingStopId] = useState<number | null>(null)
  const [stopError, setStopError] = useState<string | null>(null)

  function load() {
    if (!token) return
    return Promise.all([
      fetchAvailableDeliveries(token),
      fetchMyDeliveries(token),
      fetchDeliveriesTrends(token),
      fetchTransportEarnings(token),
    ]).then(([availableRes, mineRes, trendRes, earningsRes]) => {
      setAvailable(availableRes)
      setMine(mineRes)
      setDeliveriesTrend(trendRes)
      setEarnings(earningsRes)
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

  function loadTransporterProfile() {
    if (!token) return
    return fetchMyTransporterProfile(token).then(setTransporterProfile)
  }

  useEffect(() => {
    load()
    loadRoutes()
    loadTransporterProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    Promise.all([fetchCountries(), fetchRegions()]).then(([countriesRes, regionsRes]) => {
      setCountries(countriesRes)
      setRegions(regionsRes)
    })
  }, [])

  async function handleToggleAvailability() {
    if (!token || !transporterProfile) return
    setAvailabilityError(null)
    setSavingAvailability(true)
    try {
      const updated = await setAvailability(!transporterProfile.is_available, token)
      setTransporterProfile(updated)
    } catch (err) {
      setAvailabilityError(
        err instanceof ApiError ? err.message : t('transporterDashboard.availabilityError'),
      )
    } finally {
      setSavingAvailability(false)
    }
  }

  useEffect(() => {
    const hasActiveDelivery = mine.some(
      (o) => o.status === 'confirmed' || o.status === 'collected' || o.status === 'shipped',
    )

    if (!token || !transporterProfile?.is_available || !hasActiveDelivery || !navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (watchIdRef.current !== null) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateTransporterLocation(position.coords.latitude, position.coords.longitude, token).catch(
          () => {
            // transient location update failures are fine, next tick retries
          },
        )
      },
      () => {
        // ignore geolocation errors (permission denied, unavailable, etc.)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [token, transporterProfile?.is_available, mine])

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

  async function handleToggleStops(orderId: number) {
    if (!token) return
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setOrderTracking(null)
      return
    }
    setStopError(null)
    setExpandedOrderId(orderId)
    try {
      const tracking = await fetchOrderTracking(orderId, token)
      setOrderTracking(tracking)
    } catch (err) {
      setStopError(err instanceof ApiError ? err.message : t('transporterDashboard.stopError'))
    }
  }

  async function handleCompleteStop(orderId: number, stopId: number) {
    if (!token) return
    setStopError(null)
    setCompletingStopId(stopId)
    try {
      await completeDeliveryStop(orderId, stopId, token)
      const tracking = await fetchOrderTracking(orderId, token)
      setOrderTracking(tracking)
      await load()
    } catch (err) {
      setStopError(err instanceof ApiError ? err.message : t('transporterDashboard.stopError'))
    } finally {
      setCompletingStopId(null)
    }
  }

  const activeDeliveries = mine.filter(
    (o) => o.status === 'confirmed' || o.status === 'collected' || o.status === 'shipped',
  )
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

      {transporterProfile && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4">
          {transporterProfile.verification_status === 'approved' ? (
            <>
              <div>
                <p className="text-sm font-semibold text-leaf-950">
                  {t('transporterDashboard.availabilityTitle')}
                </p>
                <p className="text-xs text-leaf-950/60">
                  {transporterProfile.is_available
                    ? t('transporterDashboard.availabilityOn')
                    : t('transporterDashboard.availabilityOff')}
                </p>
                {availabilityError && (
                  <p className="mt-1 text-xs text-earth-800">{availabilityError}</p>
                )}
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={savingAvailability}
                className={`rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60 ${
                  transporterProfile.is_available
                    ? 'bg-leaf-700 text-white hover:bg-leaf-800'
                    : 'border border-leaf-300 text-leaf-700 hover:bg-leaf-50'
                }`}
              >
                {transporterProfile.is_available
                  ? t('transporterDashboard.goOffline')
                  : t('transporterDashboard.goOnline')}
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-leaf-950">
                  {t(`transporterDashboard.verification.${transporterProfile.verification_status}`)}
                </p>
                <p className="text-xs text-leaf-950/60">{t('transporterDashboard.verificationHint')}</p>
              </div>
              <Link
                to="/transportador/documentos"
                className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-800"
              >
                <FileText size={14} /> {t('transporterDashboard.manageDocuments')}
              </Link>
            </>
          )}
        </div>
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

      {/* Earnings */}
      {earnings && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-leaf-950">
            {t('transporterDashboard.earningsTitle')}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatTile
              icon={Wallet}
              label={t('transporterDashboard.statTotalSales')}
              value={`${earnings.gross_sales.toLocaleString('pt-AO')} Kz`}
            />
            <StatTile
              icon={Percent}
              label={t('transporterDashboard.statCommission')}
              value={`${earnings.commission.toLocaleString('pt-AO')} Kz`}
            />
            <StatTile
              icon={Banknote}
              label={t('transporterDashboard.statAvailableBalance')}
              value={`${earnings.available_balance.toLocaleString('pt-AO')} Kz`}
            />
          </div>
        </div>
      )}

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
            {mine.map((order) => {
              const isActive =
                order.status === 'confirmed' || order.status === 'collected' || order.status === 'shipped'
              return (
                <div key={order.id} className="rounded-2xl border border-leaf-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleToggleStops(order.id)}
                          className="rounded-full border border-leaf-300 px-4 py-2 text-xs font-semibold text-leaf-700 hover:bg-leaf-50"
                        >
                          {expandedOrderId === order.id
                            ? t('transporterDashboard.hideStops')
                            : t('transporterDashboard.viewStops')}
                        </button>
                      )}
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
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-4 border-t border-leaf-100 pt-4">
                      {stopError && (
                        <p className="mb-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                          {stopError}
                        </p>
                      )}
                      {!orderTracking ? (
                        <p className="text-xs text-leaf-950/60">{t('transporterDashboard.loadingStops')}</p>
                      ) : (
                        <div className="space-y-2">
                          {orderTracking.stops.map((stop, index) => (
                            <div
                              key={stop.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-leaf-50/60 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 text-sm text-leaf-950">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-xs font-semibold text-white">
                                  {index + 1}
                                </span>
                                <span>
                                  {stop.stop_type === 'pickup'
                                    ? t('transporterDashboard.pickupAt', {
                                        name: stop.farm_name ?? t('transporterDashboard.farm'),
                                      })
                                    : t('transporterDashboard.dropoffAtBuyer')}
                                </span>
                              </div>
                              {stop.status === 'completed' ? (
                                <span className="text-xs font-medium text-leaf-700">
                                  {t('transporterDashboard.stopCompleted')}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleCompleteStop(order.id, stop.id)}
                                  disabled={completingStopId === stop.id}
                                  className="rounded-full bg-leaf-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                                >
                                  {completingStopId === stop.id
                                    ? t('transporterDashboard.saving')
                                    : t('transporterDashboard.markStopComplete')}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
