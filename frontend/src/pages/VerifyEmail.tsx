import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

export default function VerifyEmail() {
  const { t } = useTranslation()
  const { verifyEmailToken } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError(t('verifyEmail.missingToken'))
      return
    }

    verifyEmailToken(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : t('verifyEmail.genericError'))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      {status === 'verifying' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-leaf-600" />
          <h1 className="mt-4 text-xl font-semibold text-leaf-950">
            {t('verifyEmail.verifying')}
          </h1>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-leaf-600" />
          <h1 className="mt-4 text-xl font-semibold text-leaf-950">
            {t('verifyEmail.successTitle')}
          </h1>
          <p className="mt-2 text-sm text-leaf-950/60">{t('verifyEmail.successSubtitle')}</p>
          <Link
            to="/"
            className="mt-6 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800"
          >
            {t('verifyEmail.continue')}
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-earth-600" />
          <h1 className="mt-4 text-xl font-semibold text-leaf-950">
            {t('verifyEmail.errorTitle')}
          </h1>
          <p className="mt-2 text-sm text-leaf-950/60">{error}</p>
          <Link
            to="/perfil"
            className="mt-6 rounded-full border border-leaf-200 px-6 py-2.5 text-sm font-semibold text-leaf-950 hover:bg-leaf-50"
          >
            {t('verifyEmail.backToProfile')}
          </Link>
        </>
      )}
    </section>
  )
}
