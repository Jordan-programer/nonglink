import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { fetchAllOrders, updateOrderStatus, type AdminOrder, type OrderStatus } from '../../api/client'
import { useOrderStatusLabels } from '../../utils/orderStatus'

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function Orders() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [savingId, setSavingId] = useState<number | null>(null)
  const statusLabels = useOrderStatusLabels()

  useEffect(() => {
    if (!token) return
    fetchAllOrders(token).then((data) => {
      setOrders(data)
      setStatus('ready')
    })
  }, [token])

  async function handleStatusChange(id: number, newStatus: OrderStatus) {
    if (!token) return
    setSavingId(id)
    try {
      const updated = await updateOrderStatus(id, newStatus, token)
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } finally {
      setSavingId(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-10 text-center text-sm text-leaf-950/60">
        {t('adminOrders.noOrders')}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-leaf-950">{t('adminOrders.title')}</h2>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-leaf-100 text-xs font-medium uppercase tracking-wide text-leaf-950/50">
              <th className="px-4 py-3">{t('adminOrders.colOrder')}</th>
              <th className="px-4 py-3">{t('adminOrders.colBuyer')}</th>
              <th className="px-4 py-3">{t('adminOrders.colProducts')}</th>
              <th className="px-4 py-3">{t('adminOrders.colTotal')}</th>
              <th className="px-4 py-3">{t('adminOrders.colDate')}</th>
              <th className="px-4 py-3">{t('adminOrders.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-leaf-50 last:border-0">
                <td className="px-4 py-3 font-medium text-leaf-950">#{order.id}</td>
                <td className="px-4 py-3 text-leaf-950/70">
                  <div>{order.buyer_name}</div>
                  <div className="text-xs text-leaf-950/50">{order.buyer_email}</div>
                </td>
                <td className="px-4 py-3 text-leaf-950/70">
                  {order.items.map((item) => item.product_name).join(', ')}
                </td>
                <td className="px-4 py-3 font-medium text-leaf-950">
                  {order.total_amount.toLocaleString('pt-AO')} Kz
                </td>
                <td className="px-4 py-3 text-leaf-950/60">
                  {new Date(order.created_at).toLocaleDateString('pt-AO')}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-leaf-200 bg-white px-2 py-1.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
