import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-leaf-950/50">
        {t('common.loading')}
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
