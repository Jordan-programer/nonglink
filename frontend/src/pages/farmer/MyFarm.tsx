import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Sprout } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createFarm,
  fetchMyFarms,
  updateFarm,
  type Farm,
} from '../../api/client'

export default function MyFarm() {
  const { token } = useAuth()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [sizeHectares, setSizeHectares] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchMyFarms(token).then((farms) => {
      const existing = farms[0] ?? null
      setFarm(existing)
      if (existing) {
        setName(existing.name)
        setLocation(existing.location ?? '')
        setSizeHectares(existing.size_hectares?.toString() ?? '')
      }
      setStatus('ready')
    })
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    setError(null)
    setSaved(false)
    setSubmitting(true)

    const payload = {
      name,
      location: location || undefined,
      size_hectares: sizeHectares ? Number(sizeHectares) : undefined,
    }

    try {
      const result = farm
        ? await updateFarm(farm.id, payload, token)
        : await createFarm(payload, token)
      setFarm(result)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível guardar a lavra.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <div className="h-64 animate-pulse rounded-2xl bg-leaf-50" />
  }

  return (
    <div className="rounded-2xl border border-leaf-100 bg-white p-6">
      <div className="flex items-center gap-2 text-leaf-800">
        <Sprout size={18} />
        <h2 className="text-lg font-semibold text-leaf-950">
          {farm ? 'A minha lavra' : 'Criar a minha lavra'}
        </h2>
      </div>
      <p className="mt-1 text-sm text-leaf-950/60">
        {farm
          ? 'Estes dados aparecem nos teus produtos no mercado.'
          : 'Precisas de criar uma lavra antes de poderes vender produtos.'}
      </p>

      <form className="mt-6 max-w-md space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">Nome da lavra</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Quinta do João"
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">Localização</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Huambo, Angola"
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-leaf-950/80">Área (hectares)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={sizeHectares}
            onChange={(e) => setSizeHectares(e.target.value)}
            placeholder="Ex: 3.5"
            className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
        )}
        {saved && (
          <p className="rounded-lg bg-leaf-100 px-3 py-2 text-sm text-leaf-800">
            Lavra guardada com sucesso.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-leaf-800 disabled:opacity-60"
        >
          {submitting ? 'A guardar...' : farm ? 'Guardar alterações' : 'Criar lavra'}
        </button>
      </form>
    </div>
  )
}
