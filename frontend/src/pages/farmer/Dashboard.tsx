import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, MessageCircle, Package, ShoppingBag, Sprout, Wallet, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  fetchConversations,
  fetchMyAlerts,
  fetchMyFarms,
  fetchMyHarvests,
  fetchMyProducts,
  fetchSales,
  fetchSalesTrends,
  type Conversation,
  type Farm,
  type Harvest,
  type Product,
  type Sale,
  type SensorAlert,
  type TrendPoint,
} from '../../api/client'
import StatTile from '../../components/StatTile'
import TrendChartCard from '../../components/TrendChartCard'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [salesTrend, setSalesTrend] = useState<TrendPoint[]>([])
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetchMyFarms(token),
      fetchMyProducts(token),
      fetchSales(token),
      fetchSalesTrends(token),
      fetchMyHarvests(token),
      fetchMyAlerts(token),
      fetchConversations(token),
    ]).then(
      ([farmsRes, productsRes, salesRes, salesTrendRes, harvestsRes, alertsRes, conversationsRes]) => {
        setFarms(farmsRes)
        setProducts(productsRes)
        setSales(salesRes)
        setSalesTrend(salesTrendRes)
        setHarvests(harvestsRes)
        setAlerts(alertsRes)
        setConversations(conversationsRes)
        setStatus('ready')
      },
    )
  }, [token])

  const revenue = sales.reduce((sum, s) => sum + s.quantity * s.unit_price, 0)
  const pending = sales.filter((s) => s.status === 'pending').length
  const activeHarvests = harvests.filter(
    (h) => h.status === 'planted' || h.status === 'growing',
  ).length
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  const stats = [
    { icon: Sprout, label: t('farmerDashboard.statFarms'), value: farms.length },
    { icon: Package, label: t('farmerDashboard.statActiveProducts'), value: products.length },
    { icon: ShoppingBag, label: t('farmerDashboard.statPendingOrders'), value: pending },
    {
      icon: Wallet,
      label: t('farmerDashboard.statRevenue'),
      value: `${revenue.toLocaleString('pt-AO')} Kz`,
      trend: salesTrend,
    },
    { icon: Wheat, label: t('farmerDashboard.statActiveHarvests'), value: activeHarvests },
    { icon: AlertCircle, label: t('farmerDashboard.statActiveAlerts'), value: activeAlerts },
    { icon: MessageCircle, label: t('farmerDashboard.statUnreadMessages'), value: unreadMessages },
  ]

  if (status === 'loading') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-leaf-950/60">
        {t('farmerDashboard.welcomeBack')}
        <span className="font-medium text-leaf-900">{user?.name}</span>.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon, label, value, trend }) => (
          <StatTile key={label} icon={icon} label={label} value={value} trendSeries={trend} />
        ))}
      </div>

      <div className="mt-8">
        <TrendChartCard
          title="Vendas"
          subtitle="Últimos 30 dias"
          series={salesTrend}
          kind="line"
          unit=" Kz"
        />
      </div>

      {farms.length === 0 && (
        <div className="mt-6 rounded-2xl border border-earth-200 bg-earth-50 p-6 text-earth-800">
          <p className="font-medium">{t('farmerDashboard.createFarmCta')}</p>
          <Link
            to="/painel/lavra"
            className="mt-3 inline-flex rounded-full bg-earth-600 px-5 py-2 text-sm font-semibold text-white hover:bg-earth-700"
          >
            {t('farmerDashboard.createFarmButton')}
          </Link>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-leaf-950">{t('farmerDashboard.recentOrders')}</h2>
          <Link
            to="/painel/encomendas"
            className="text-sm font-medium text-leaf-700 hover:text-leaf-800"
          >
            {t('farmerDashboard.viewAll')}
          </Link>
        </div>

        {sales.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
            {t('farmerDashboard.noOrdersYet')}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.order_item_id}
                className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-leaf-950">{sale.product_name}</p>
                  <p className="text-xs text-leaf-950/60">
                    {sale.buyer_name} · {sale.quantity} un.
                  </p>
                </div>
                <p className="text-sm font-semibold text-leaf-900">
                  {(sale.quantity * sale.unit_price).toLocaleString('pt-AO')} Kz
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
