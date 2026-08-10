import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  Truck,
  User,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { fetchConversations } from '../api/client'

export default function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!token) {
      setUnreadCount(0)
      return
    }

    function load() {
      fetchConversations(token!)
        .then((data) => setUnreadCount(data.reduce((sum, c) => sum + c.unread_count, 0)))
        .catch(() => {})
    }

    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [token])

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/mercado', label: t('nav.market') },
    { to: '/#como-funciona', label: t('nav.howItWorks') },
  ]

  const accountLink =
    user?.role === 'admin' || user?.role === 'superadmin'
      ? { to: '/admin', label: t('nav.admin'), icon: ShieldCheck }
      : user?.role === 'buyer'
        ? { to: '/comprador', label: t('nav.dashboard'), icon: LayoutDashboard }
        : user?.role === 'transporter'
          ? { to: '/transportador', label: t('nav.dashboard'), icon: Truck }
          : { to: '/painel', label: t('nav.dashboard'), icon: LayoutDashboard }

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/', { replace: true })
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
                to="/mensagens"
                className="relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                <MessageCircle size={15} /> Mensagens
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-earth-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to={accountLink.to}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                <accountLink.icon size={15} /> {accountLink.label}
              </Link>
              <Link
                to="/perfil"
                className="flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-sm font-medium text-leaf-800 hover:bg-leaf-200"
              >
                <User size={14} />
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                <LogOut size={15} /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                className="rounded-full px-4 py-2 text-sm font-medium text-leaf-900 hover:bg-leaf-100"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/registar"
                className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-leaf-700/20 transition-colors hover:bg-leaf-800"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </div>

        <button
          className="rounded-lg p-2 text-leaf-900 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={t('nav.openMenu')}
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
                  to="/mensagens"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-leaf-950/80"
                >
                  <MessageCircle size={15} /> Mensagens
                  {unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-earth-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to={accountLink.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-leaf-950/80"
                >
                  <accountLink.icon size={15} /> {accountLink.label}
                </Link>
                <Link
                  to="/perfil"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-leaf-800"
                >
                  <User size={15} /> {t('nav.myProfile', { name: user.name.split(' ')[0] })}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-leaf-200 px-4 py-2 text-sm font-medium text-leaf-900"
                >
                  <LogOut size={15} /> {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/entrar"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-leaf-200 px-4 py-2 text-center text-sm font-medium text-leaf-900"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/registar"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-leaf-700 px-4 py-2 text-center text-sm font-medium text-white"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
            <LanguageSwitcher className="pt-2" />
          </nav>
        </div>
      )}
    </header>
  )
}
