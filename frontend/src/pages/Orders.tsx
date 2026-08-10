import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { fetchMyOrders, type Order } from '../api/client'
import { useOrderStatusLabels, STATUS_STYLES } from '../utils/orderStatus'

export default function Orders() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const statusLabels = useOrderStatusLabels()

  useEffect(() => {
    if (!token) return
    fetchMyOrders(token).then((data) => {
      setOrders(data)
      setStatus('ready')
    })
  }, [token])

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
        {t('myOrders.title')}
      </h1>
      <p className="mt-1 text-sm text-leaf-950/60">{t('myOrders.subtitle')}</p>

      <div className="mt-8">
        {status === 'loading' && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-leaf-50" />
            ))}
          </div>
        )}

        {status === 'ready' && orders.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-leaf-100 bg-leaf-50 px-6 py-14 text-center">
            <PackageSearch className="text-leaf-700/60" size={32} />
            <p className="mt-3 text-sm text-leaf-950/60">{t('myOrders.noOrdersYet')}</p>
            <Link
              to="/mercado"
              className="mt-4 rounded-full bg-leaf-700 px-5 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
            >
              {t('myOrders.exploreMarket')}
            </Link>
          </div>
        )}

        {status === 'ready' && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-leaf-100 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-leaf-950">
                      {t('myOrders.orderNumber', { id: order.id })}
                    </p>
                    <p className="text-xs text-leaf-950/50">
                      {new Date(order.created_at).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>

                <div className="mt-4 divide-y divide-leaf-50 border-t border-leaf-50">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-leaf-950/80">
                        {item.product_name}{' '}
                        <span className="text-leaf-950/50">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-leaf-950">
                        {(item.quantity * item.unit_price).toLocaleString('pt-AO')} Kz
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-leaf-100 pt-3">
                  <span className="text-sm font-medium text-leaf-950/70">{t('myOrders.total')}</span>
                  <span className="text-base font-semibold text-leaf-900">
                    {order.total_amount.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
