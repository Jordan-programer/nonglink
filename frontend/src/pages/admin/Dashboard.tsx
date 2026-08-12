import { useEffect, useState } from 'react'
import { Package, ShoppingBag, Sprout, Truck, Users, Wallet, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAdminStats,
  fetchAdminStatsTrends,
  type AdminStats,
  type AdminTrends,
} from '../../api/client'
import StatTile from '../../components/StatTile'
import TrendChartCard from '../../components/TrendChartCard'

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [trends, setTrends] = useState<AdminTrends | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const roleLabels: Record<keyof AdminStats['users_by_role'], string> = {
    farmer: t('adminDashboard.roleFarmer'),
    buyer: t('adminDashboard.roleBuyer'),
    distributor: t('adminDashboard.roleDistributor'),
    transporter: t('adminDashboard.roleTransporter'),
    admin: t('adminDashboard.roleAdmin'),
    superadmin: t('adminDashboard.roleSuperadmin'),
  }

  useEffect(() => {
    if (!token) return
    Promise.all([fetchAdminStats(token), fetchAdminStatsTrends(token)]).then(([s, tr]) => {
      setStats(s)
      setTrends(tr)
      setStatus('ready')
    })
  }, [token])

  if (status === 'loading' || !stats || !trends) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  const cards = [
    { icon: Users, label: t('adminDashboard.users'), value: stats.total_users, trend: trends.new_users },
    { icon: Sprout, label: t('adminDashboard.farms'), value: stats.total_farms },
    { icon: Package, label: t('adminDashboard.products'), value: stats.total_products },
    { icon: ShoppingBag, label: t('adminDashboard.pendingOrders'), value: stats.pending_orders },
    {
      icon: Wallet,
      label: t('adminDashboard.totalRevenue'),
      value: `${stats.total_revenue.toLocaleString('pt-AO')} Kz`,
      trend: trends.revenue,
    },
    { icon: Wheat, label: t('adminDashboard.harvests'), value: stats.total_harvests },
    { icon: Truck, label: t('adminDashboard.routes'), value: stats.total_routes },
    {
      icon: Truck,
      label: t('adminDashboard.activeDeliveries'),
      value: stats.active_deliveries,
    },
  ]

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon, label, value, trend }) => (
          <StatTile key={label} icon={icon} label={label} value={value} trendSeries={trend} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <TrendChartCard
          title="Novos utilizadores"
          subtitle="Últimos 30 dias"
          series={trends.new_users}
          kind="bar"
        />
        <TrendChartCard
          title="Receita"
          subtitle="Últimos 30 dias"
          series={trends.revenue}
          kind="line"
          unit=" Kz"
        />
        <TrendChartCard
          title="Novas encomendas"
          subtitle="Últimos 30 dias"
          series={trends.new_orders}
          kind="bar"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-leaf-950">{t('adminDashboard.usersByRole')}</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-leaf-100 bg-white">
          {(Object.keys(stats.users_by_role) as (keyof AdminStats['users_by_role'])[]).map(
            (role, i) => (
              <div
                key={role}
                className={`flex items-center justify-between px-5 py-3 text-sm ${
                  i > 0 ? 'border-t border-leaf-50' : ''
                }`}
              >
                <span className="text-leaf-950/70">{roleLabels[role]}</span>
                <span className="font-semibold text-leaf-950">{stats.users_by_role[role]}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
