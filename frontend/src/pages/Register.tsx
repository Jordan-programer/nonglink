import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Phone, User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError, type UserRole } from '../api/client'

const roles: { value: UserRole; label: string }[] = [
  { value: 'farmer', label: 'Agricultor' },
  { value: 'buyer', label: 'Comprador' },
  { value: 'distributor', label: 'Distribuidor' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('farmer')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register({ name, email, password, role, phone: phone || undefined })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
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

      <div className="relative mx-auto max-w-md px-6">
        <div className="rounded-3xl border border-leaf-100 bg-white/90 p-8 shadow-xl shadow-leaf-950/10 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
            Criar conta no AgriLink
          </h1>
          <p className="mt-1.5 text-sm text-leaf-950/60">
            Junta-te à plataforma como agricultor, comprador ou distribuidor.
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
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
              <span className="text-sm font-medium text-leaf-950/80">Nome completo</span>
              <div className="relative mt-1.5">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Email</span>
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
                  placeholder="tu@exemplo.com"
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Telefone (opcional)</span>
              <div className="relative mt-1.5">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="923 000 000"
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">Password</span>
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
                  placeholder="Mínimo 6 caracteres"
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
              {submitting ? 'A criar conta...' : 'Criar conta'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-leaf-950/60">
            Já tens conta?{' '}
            <Link to="/entrar" className="font-medium text-leaf-700 hover:text-leaf-800">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
