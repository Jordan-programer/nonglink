import { useEffect, useState } from 'react'
import { Banknote, Percent, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { fetchSales, fetchSalesSummary, type EarningsSummary, type Sale } from '../../api/client'
import { useOrderStatusLabels, STATUS_STYLES } from '../../utils/orderStatus'
import StatTile from '../../components/StatTile'

export default function Sales() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const statusLabels = useOrderStatusLabels()

  useEffect(() => {
    if (!token) return
    Promise.all([fetchSales(token), fetchSalesSummary(token)]).then(([salesRes, summaryRes]) => {
      setSales(salesRes)
      setSummary(summaryRes)
      setStatus('ready')
    })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-leaf-950">{t('sales.title')}</h2>

      {summary && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={Wallet}
            label={t('sales.summaryTotal')}
            value={`${summary.gross_sales.toLocaleString('pt-AO')} Kz`}
          />
          <StatTile
            icon={Percent}
            label={t('sales.summaryCommission')}
            value={`${summary.commission.toLocaleString('pt-AO')} Kz`}
          />
          <StatTile
            icon={Banknote}
            label={t('sales.summaryBalance')}
            value={`${summary.available_balance.toLocaleString('pt-AO')} Kz`}
          />
        </div>
      )}

      {sales.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-10 text-center text-sm text-leaf-950/60">
          {t('sales.noOrdersYet')}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-leaf-100 text-xs font-medium uppercase tracking-wide text-leaf-950/50">
                <th className="px-4 py-3">{t('sales.product')}</th>
                <th className="px-4 py-3">{t('sales.buyer')}</th>
                <th className="px-4 py-3">{t('sales.quantity')}</th>
                <th className="px-4 py-3">{t('sales.total')}</th>
                <th className="px-4 py-3">{t('sales.status')}</th>
                <th className="px-4 py-3">{t('sales.date')}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.order_item_id} className="border-b border-leaf-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-leaf-950">{sale.product_name}</td>
                  <td className="px-4 py-3 text-leaf-950/70">{sale.buyer_name}</td>
                  <td className="px-4 py-3 text-leaf-950/70">{sale.quantity}</td>
                  <td className="px-4 py-3 font-medium text-leaf-950">
                    {(sale.quantity * sale.unit_price).toLocaleString('pt-AO')} Kz
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[sale.status]}`}
                    >
                      {statusLabels[sale.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-leaf-950/60">
                    {new Date(sale.created_at).toLocaleDateString('pt-AO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
