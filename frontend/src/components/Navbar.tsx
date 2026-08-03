import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Início' },
  { to: '/mercado', label: 'Mercado' },
  { to: '/#como-funciona', label: 'Como funciona' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-leaf-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-leaf-900">
          <Logo className="h-9 w-9 rounded-lg" />
          <span className="text-lg tracking-tight">AgriLink</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-leaf-700 ${
                  isActive ? 'text-leaf-800' : 'text-leaf-950/70'
                }`
              }
              end={link.to === '/'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/painel"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                <LayoutDashboard size={15} /> Painel
              </Link>
              <Link
                to="/painel"
                className="flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-sm font-medium text-leaf-800"
              >
                <User size={14} />
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                <LogOut size={15} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                className="rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                Entrar
              </Link>
              <Link
                to="/registar"
                className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-leaf-700/20 transition-colors hover:bg-leaf-800"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-leaf-900 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-leaf-100 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-leaf-950/80"
              >
                {link.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <Link
                  to="/painel"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-leaf-800"
                >
                  <LayoutDashboard size={15} /> Painel ({user.name.split(' ')[0]})
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-leaf-200 px-4 py-2 text-sm font-medium text-leaf-900"
                >
                  <LogOut size={15} /> Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/entrar"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-leaf-200 px-4 py-2 text-center text-sm font-medium text-leaf-900"
                >
                  Entrar
                </Link>
                <Link
                  to="/registar"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-leaf-700 px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
