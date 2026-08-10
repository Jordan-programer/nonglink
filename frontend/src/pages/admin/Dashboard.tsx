import { useEffect, useState } from 'react'
import { Package, ShoppingBag, Sprout, Truck, Users, Wallet, Wheat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { fetchAdminStats, type AdminStats } from '../../api/client'

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
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
    fetchAdminStats(token).then((data) => {
      setStats(data)
      setStatus('ready')
    })
  }, [token])

  if (status === 'loading' || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  const cards = [
    { icon: Users, label: t('adminDashboard.users'), value: stats.total_users },
    { icon: Sprout, label: t('adminDashboard.farms'), value: stats.total_farms },
    { icon: Package, label: t('adminDashboard.products'), value: stats.total_products },
    { icon: ShoppingBag, label: t('adminDashboard.pendingOrders'), value: stats.pending_orders },
    {
      icon: Wallet,
      label: t('adminDashboard.totalRevenue'),
      value: `${stats.total_revenue.toLocaleString('pt-AO')} Kz`,
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
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-leaf-100 bg-white p-5">
            <div className="inline-flex rounded-xl bg-leaf-100 p-2.5 text-leaf-700">
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-leaf-950">{value}</p>
            <p className="text-sm text-leaf-950/60">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-leaf-950">{t('adminDashboard.usersByRole')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(stats.users_by_role) as (keyof AdminStats['users_by_role'])[]).map(
            (role) => (
              <div
                key={role}
                className="rounded-2xl bg-leaf-50 p-5 text-center"
              >
                <p className="text-2xl font-semibold text-leaf-900">
                  {stats.users_by_role[role]}
                </p>
                <p className="text-sm text-leaf-950/60">{roleLabels[role]}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
