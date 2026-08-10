import { useEffect, useState } from 'react'
import { ArrowRight, MapPin, Package, Phone, Plus, Trash2, TrendingUp, Truck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  claimDelivery,
  createRoute,
  deleteRoute,
  fetchAvailableDeliveries,
  fetchCountries,
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
} from '../../api/client'
import { STATUS_STYLES, useOrderStatusLabels } from '../../utils/orderStatus'

export default function TransporterDashboard() {
  const { user, token } = useAuth()
  const statusLabels = useOrderStatusLabels()

  const [available, setAvailable] = useState<TransportOrder[]>([])
  const [mine, setMine] = useState<TransportOrder[]>([])
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
    return Promise.all([fetchAvailableDeliveries(token), fetchMyDeliveries(token)]).then(
      ([availableRes, mineRes]) => {
        setAvailable(availableRes)
        setMine(mineRes)
        setStatus('ready')
      },
    )
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
      setRouteError(err instanceof ApiError ? err.message : 'Não foi possível adicionar a rota.')
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
      setError(err instanceof ApiError ? err.message : 'Não foi possível aceitar a entrega.')
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
      setError(err instanceof ApiError ? err.message : 'Não foi possível atualizar o estado.')
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
        Olá, <span className="text-leaf-700">{user?.name.split(' ')[0]}</span>
      </h1>
      <p className="mt-1 text-sm text-leaf-950/60">
        Gere as tuas entregas: aceita encomendas prontas para transporte e atualiza o estado.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-leaf-100 bg-white p-5">
          <div className="inline-flex rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
            <Package size={18} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-leaf-950">{available.length}</p>
          <p className="text-sm text-leaf-950/60">Disponíveis para recolha</p>
        </div>
        <div className="rounded-2xl border border-leaf-100 bg-white p-5">
          <div className="inline-flex rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
            <Truck size={18} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-leaf-950">{activeDeliveries.length}</p>
          <p className="text-sm text-leaf-950/60">Entregas em curso</p>
        </div>
        <div className="rounded-2xl border border-leaf-100 bg-white p-5">
          <div className="inline-flex rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
            <Package size={18} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-leaf-950">{pastDeliveries.length}</p>
          <p className="text-sm text-leaf-950/60">Entregues</p>
        </div>
      </div>

      {/* Available pool */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-leaf-950">Entregas disponíveis</h2>
        {available.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Sem encomendas à espera de transporte neste momento.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {available.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-leaf-950">Encomenda #{order.id}</p>
                  <p className="text-xs text-leaf-950/60">
                    {order.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-leaf-950/60">
                    Para: {order.buyer_name}
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
                    Aceitar entrega
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My deliveries */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-leaf-950">As minhas entregas</h2>
        {mine.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não aceitaste nenhuma entrega.
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
                    <p className="text-sm font-semibold text-leaf-950">Encomenda #{order.id}</p>
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
                    Para: {order.buyer_name}
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
                    {order.status === 'confirmed' ? 'Marcar como enviado' : 'Marcar como entregue'}
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
          <TrendingUp size={18} className="text-leaf-700" /> Rotas mais procuradas
        </h2>
        <p className="mt-1 text-sm text-leaf-950/60">
          Corredores com mais encomendas entregues, em toda a plataforma — usa isto para decidir
          que rotas vale a pena cobrir.
        </p>

        {popularRoutes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não há dados suficientes de encomendas para sugerir rotas.
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
                      {r.order_count} encomenda{r.order_count === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => handleAddRoute(r.origin_region_id, r.destination_region_id)}
                      disabled={alreadyAdded || savingRoute}
                      className="rounded-full border border-leaf-300 px-3 py-1.5 text-xs font-semibold text-leaf-700 hover:bg-leaf-50 disabled:opacity-50"
                    >
                      {alreadyAdded ? 'Já adicionada' : 'Adicionar'}
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
          <h2 className="text-lg font-semibold text-leaf-950">As minhas rotas</h2>
          {!showRouteForm && (
            <button
              onClick={() => setShowRouteForm(true)}
              className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
            >
              <Plus size={16} /> Nova rota
            </button>
          )}
        </div>

        {showRouteForm && (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">Origem</span>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleciona
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
                <span className="text-sm font-medium text-leaf-950/80">Destino</span>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                >
                  <option value="" disabled>
                    Seleciona
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
                {savingRoute ? 'A guardar...' : 'Guardar rota'}
              </button>
              <button
                onClick={() => setShowRouteForm(false)}
                className="text-sm font-medium text-leaf-950/60 hover:text-leaf-950"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {myRoutes.length === 0 && !showRouteForm ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            Ainda não adicionaste nenhuma rota.
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
                  aria-label="Remover rota"
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
