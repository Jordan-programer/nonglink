import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Sprout, ShoppingBag, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function AdminLayout() {
  const { t } = useTranslation()

  const links = [
    { to: '/', label: t('adminLayout.navDashboard'), icon: LayoutDashboard, end: true },
    { to: '/utilizadores', label: t('adminLayout.navUsers'), icon: Users },
    { to: '/encomendas', label: t('adminLayout.navOrders'), icon: ShoppingBag },
    { to: '/lavras', label: t('adminLayout.navFarms'), icon: Sprout },
  ]

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
          {t('adminLayout.title')}
        </h1>
        <p className="mt-1 text-sm text-leaf-950/60">{t('adminLayout.subtitle')}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-leaf-700 text-white'
                    : 'text-leaf-950/70 hover:bg-leaf-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
