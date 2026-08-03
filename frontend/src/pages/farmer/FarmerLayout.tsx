import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Sprout } from 'lucide-react'

const links = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/painel/produtos', label: 'Produtos', icon: Package },
  { to: '/painel/encomendas', label: 'Encomendas', icon: ShoppingBag },
  { to: '/painel/lavra', label: 'A minha lavra', icon: Sprout },
]

export default function FarmerLayout() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
          Área do agricultor
        </h1>
        <p className="mt-1 text-sm text-leaf-950/60">
          Gere a tua lavra, os teus produtos e as encomendas recebidas.
        </p>
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
