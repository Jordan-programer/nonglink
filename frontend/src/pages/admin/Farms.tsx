import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { fetchAllFarms, type AdminFarm } from '../../api/client'

export default function Farms() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [farms, setFarms] = useState<AdminFarm[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    if (!token) return
    fetchAllFarms(token).then((data) => {
      setFarms(data)
      setStatus('ready')
    })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  if (farms.length === 0) {
    return (
      <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-10 text-center text-sm text-leaf-950/60">
        {t('adminFarms.noFarms')}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-leaf-950">{t('adminFarms.title')}</h2>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-leaf-100 text-xs font-medium uppercase tracking-wide text-leaf-950/50">
              <th className="px-4 py-3">{t('adminFarms.colFarm')}</th>
              <th className="px-4 py-3">{t('adminFarms.colOwner')}</th>
              <th className="px-4 py-3">{t('adminFarms.colLocation')}</th>
              <th className="px-4 py-3">{t('adminFarms.colArea')}</th>
            </tr>
          </thead>
          <tbody>
            {farms.map((farm) => (
              <tr key={farm.id} className="border-b border-leaf-50 last:border-0">
                <td className="px-4 py-3 font-medium text-leaf-950">{farm.name}</td>
                <td className="px-4 py-3 text-leaf-950/70">{farm.owner_name}</td>
                <td className="px-4 py-3 text-leaf-950/60">{farm.location ?? '—'}</td>
                <td className="px-4 py-3 text-leaf-950/60">
                  {farm.size_hectares ? `${farm.size_hectares} ha` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
