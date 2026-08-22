import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Ban, CheckCircle2, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  createAdmin,
  deleteUser,
  fetchAllUsers,
  fetchCountries,
  updateUserRole,
  updateUserStatus,
  type Country,
  type User,
  type UserRole,
} from '../../api/client'

const ROLES: UserRole[] = ['farmer', 'buyer', 'distributor', 'transporter', 'admin', 'superadmin']
const ADMIN_TIER: UserRole[] = ['admin', 'superadmin']

export default function Users() {
  const { t } = useTranslation()
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [countries, setCountries] = useState<Country[]>([])
  const [showNewAdmin, setShowNewAdmin] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    country_id: '',
  })
  const [newAdminError, setNewAdminError] = useState<string | null>(null)
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  const isSuperadmin = currentUser?.role === 'superadmin'

  useEffect(() => {
    fetchCountries().then(setCountries)
  }, [])

  const roleLabels: Record<UserRole, string> = {
    farmer: t('adminUsers.roleFarmer'),
    buyer: t('adminUsers.roleBuyer'),
    distributor: t('adminUsers.roleDistributor'),
    transporter: t('adminUsers.roleTransporter'),
    admin: t('adminUsers.roleAdmin'),
    superadmin: t('adminUsers.roleSuperadmin'),
  }

  function load() {
    if (!token) return
    fetchAllUsers(token).then((data) => {
      setUsers(data)
      setStatus('ready')
    })
  }

  useEffect(load, [token])

  async function handleRoleChange(id: number, role: UserRole) {
    if (!token) return
    setError(null)
    setSavingId(id)
    try {
      const updated = await updateUserRole(id, role, token)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminUsers.roleError'))
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleStatus(user: User) {
    if (!token) return
    setError(null)
    setSavingId(user.id)
    try {
      const updated = await updateUserStatus(user.id, !user.is_active, token)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminUsers.statusError'))
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    if (!confirm(t('adminUsers.confirmDelete'))) return
    setError(null)
    try {
      await deleteUser(id, token)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminUsers.deleteError'))
    }
  }

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!newAdmin.country_id) {
      setNewAdminError(t('adminUsers.selectCountryError'))
      return
    }
    setNewAdminError(null)
    setCreatingAdmin(true)
    try {
      const created = await createAdmin(
        {
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          phone: newAdmin.phone || undefined,
          country_id: Number(newAdmin.country_id),
        },
        token,
      )
      setUsers((prev) => [...prev, created])
      setShowNewAdmin(false)
      setNewAdmin({ name: '', email: '', phone: '', password: '', country_id: '' })
    } catch (err) {
      setNewAdminError(err instanceof ApiError ? err.message : t('adminUsers.createError'))
    } finally {
      setCreatingAdmin(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-leaf-950">{t('adminUsers.title')}</h2>
          {!isSuperadmin && (
            <p className="mt-1 text-sm text-leaf-950/50">{t('adminUsers.notSuperadminNote')}</p>
          )}
        </div>
        {isSuperadmin && !showNewAdmin && (
          <button
            onClick={() => setShowNewAdmin(true)}
            className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800"
          >
            <Plus size={16} /> {t('adminUsers.newAdmin')}
          </button>
        )}
      </div>

      {showNewAdmin && (
        <form
          onSubmit={handleCreateAdmin}
          className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50/60 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-leaf-950">{t('adminUsers.newAdmin')}</h3>
            <button
              type="button"
              onClick={() => setShowNewAdmin(false)}
              className="text-leaf-950/50 hover:text-leaf-950"
              aria-label={t('adminUsers.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('adminUsers.name')}</span>
              <input
                required
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('adminUsers.email')}</span>
              <input
                type="email"
                required
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('adminUsers.phoneOptional')}</span>
              <input
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('adminUsers.password')}</span>
              <input
                type="password"
                required
                minLength={6}
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('adminUsers.country')}</span>
              <select
                required
                value={newAdmin.country_id}
                onChange={(e) => setNewAdmin({ ...newAdmin, country_id: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              >
                <option value="" disabled>
                  {t('adminUsers.selectCountry')}
                </option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {newAdminError && (
            <p className="mt-4 rounded-lg bg-earth-100 px-3 py-2 text-sm text-earth-800">
              {newAdminError}
            </p>
          )}

          <button
            type="submit"
            disabled={creatingAdmin}
            className="mt-5 rounded-full bg-leaf-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
          >
            {creatingAdmin ? t('adminUsers.creating') : t('adminUsers.createAdmin')}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-leaf-100 text-xs font-medium uppercase tracking-wide text-leaf-950/50">
              <th className="px-4 py-3">{t('adminUsers.colName')}</th>
              <th className="px-4 py-3">{t('adminUsers.colEmail')}</th>
              <th className="px-4 py-3">{t('adminUsers.colPhone')}</th>
              <th className="px-4 py-3">{t('adminUsers.colRole')}</th>
              <th className="px-4 py-3">{t('adminUsers.colCountry')}</th>
              <th className="px-4 py-3">{t('adminUsers.colStatus')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const touchesAdminTier = ADMIN_TIER.includes(u.role)
              const isSelf = u.id === currentUser?.id
              const statusLocked = isSelf || (touchesAdminTier && !isSuperadmin)
              const deleteLocked = !isSuperadmin || isSelf

              return (
                <tr
                  key={u.id}
                  className={`border-b border-leaf-50 last:border-0 ${!u.is_active ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-leaf-950">
                    <div className="flex items-center gap-1.5">
                      {u.name}
                      {touchesAdminTier && (
                        <ShieldCheck size={14} className="text-leaf-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-leaf-950/70">{u.email}</td>
                  <td className="px-4 py-3 text-leaf-950/60">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {isSuperadmin ? (
                      <select
                        value={u.role}
                        disabled={savingId === u.id || isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="rounded-lg border border-leaf-200 bg-white px-2 py-1.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none disabled:opacity-50"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-leaf-950/80">{roleLabels[u.role]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-leaf-950/60">{u.country_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.is_active
                          ? 'bg-leaf-100 text-leaf-700'
                          : 'bg-earth-100 text-earth-700'
                      }`}
                    >
                      {u.is_active ? t('adminUsers.active') : t('adminUsers.suspended')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={savingId === u.id || statusLocked}
                        className="rounded-full p-2 text-leaf-700 hover:bg-leaf-100 disabled:opacity-30"
                        aria-label={u.is_active ? t('adminUsers.suspend') : t('adminUsers.reactivate')}
                        title={u.is_active ? t('adminUsers.suspend') : t('adminUsers.reactivate')}
                      >
                        {u.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleteLocked}
                        className="rounded-full p-2 text-earth-700 hover:bg-earth-50 disabled:opacity-30"
                        aria-label={t('adminUsers.remove')}
                        title={t('adminUsers.remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
