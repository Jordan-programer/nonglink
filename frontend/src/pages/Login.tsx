import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'
import SocialLoginButtons from '../components/SocialLoginButtons'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-leaf-50 to-cream-50 py-16">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-leaf-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-md px-6">
        <div className="rounded-3xl border border-leaf-100 bg-white/90 p-8 shadow-xl shadow-leaf-950/10 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
            {t('login.title')}
          </h1>
          <p className="mt-1.5 text-sm text-leaf-950/60">{t('login.subtitle')}</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Email ou telefone</span>
              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@exemplo.com ou 923000000"
                  autoCapitalize="none"
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('login.password')}</span>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            {error && (
              <p className="rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 transition-colors hover:bg-leaf-800 disabled:opacity-60"
            >
              {submitting ? t('login.submitting') : t('login.submit')}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <SocialLoginButtons
            onSuccess={() => navigate(from, { replace: true })}
            onError={setError}
          />

          <p className="mt-6 text-center text-sm text-leaf-950/60">
            {t('login.noAccount')}{' '}
            <Link to="/registar" className="font-medium text-leaf-700 hover:text-leaf-800">
              {t('login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
