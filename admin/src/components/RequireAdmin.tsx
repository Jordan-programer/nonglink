import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  const unauthorized = !loading && !!user && user.role !== 'admin' && user.role !== 'superadmin'

  // Logged in but not an admin/superadmin: this app has nowhere else to
  // send them, so log them out rather than redirect into a loop.
  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-leaf-950/50">
        {t('common.loading')}
      </div>
    )
  }

  if (!user || unauthorized) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
