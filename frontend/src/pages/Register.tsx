import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Flag, Mail, MapPin, Phone, User, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  ApiError,
  fetchCountries,
  fetchRegions,
  type Country,
  type Region,
  type UserRole,
} from '../api/client'

const CALLING_CODES: Record<string, string> = {
  AO: '+244',
  CN: '+86',
  CG: '+242',
  CD: '+243',
}

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const roles: { value: UserRole; label: string }[] = [
    { value: 'farmer', label: t('register.roleFarmer') },
    { value: 'buyer', label: t('register.roleBuyer') },
    { value: 'distributor', label: t('register.roleDistributor') },
    { value: 'transporter', label: t('register.roleTransporter') },
  ]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('farmer')
  const [countries, setCountries] = useState<Country[]>([])
  const [countryId, setCountryId] = useState('')
  const [regions, setRegions] = useState<Region[]>([])
  const [regionId, setRegionId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCountries().then((data) => {
      setCountries(data)
      const angola = data.find((c) => c.code === 'AO')
      setCountryId(String((angola ?? data[0])?.id ?? ''))
    })
  }, [])

  useEffect(() => {
    if (!countryId) return
    setRegionId('')
    fetchRegions(Number(countryId))
      .then(setRegions)
      .catch(() => setRegions([]))
  }, [countryId])

  const selectedCountry = countries.find((c) => String(c.id) === countryId)
  const callingCode = selectedCountry ? CALLING_CODES[selectedCountry.code] ?? '' : ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({
        name,
        email,
        password,
        role,
        phone: phone ? `${callingCode} ${phone}` : undefined,
        region_id: Number(regionId),
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('register.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-leaf-50 to-cream-50 py-16">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-earth-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-lg px-6">
        <div className="rounded-3xl border border-leaf-100 bg-white/90 p-8 shadow-xl shadow-leaf-950/10 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
            {t('register.title')}
          </h1>
          <p className="mt-1.5 text-sm text-leaf-950/60">{t('register.subtitle')}</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    role === r.value
                      ? 'border-leaf-600 bg-leaf-700 text-white'
                      : 'border-leaf-200 bg-white text-leaf-950/70 hover:bg-leaf-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('register.fullName')}</span>
              <div className="relative mt-1.5">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('register.namePlaceholder')}
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('register.email')}</span>
              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('register.emailPlaceholder')}
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">{t('register.country')}</span>
                <div className="relative mt-1.5">
                  <Flag
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                  />
                  <select
                    required
                    value={countryId}
                    onChange={(e) => setCountryId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-leaf-950/80">{t('register.region')}</span>
                <div className="relative mt-1.5">
                  <MapPin
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                  />
                  <select
                    required
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                  >
                    <option value="" disabled>
                      {t('register.selectRegion')}
                    </option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('register.phone')}</span>
              <div className="mt-1.5 flex">
                <span className="flex items-center gap-1.5 rounded-l-xl border border-r-0 border-leaf-200 bg-leaf-50 px-3 text-sm font-medium text-leaf-950/70">
                  <Phone size={16} className="text-leaf-950/40" />
                  {callingCode || '+...'}
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('register.phonePlaceholder')}
                  className="w-full rounded-r-xl border border-leaf-200 bg-white py-2.5 px-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('register.password')}</span>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')}
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
              {submitting ? t('register.submitting') : t('register.submit')}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-leaf-950/60">
            {t('register.haveAccount')}{' '}
            <Link to="/entrar" className="font-medium text-leaf-700 hover:text-leaf-800">
              {t('register.login')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
