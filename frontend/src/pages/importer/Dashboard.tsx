import { useEffect, useState } from 'react'
import { FileText, Package2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  claimExportBatch,
  fetchAvailableExportBatches,
  fetchMyClaimedExportBatches,
  type ExportBatch,
} from '../../api/client'

export default function ImporterDashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [available, setAvailable] = useState<ExportBatch[]>([])
  const [claimed, setClaimed] = useState<ExportBatch[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'unverified'>('loading')
  const [claimingId, setClaimingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    if (!token) return
    Promise.all([fetchAvailableExportBatches(token), fetchMyClaimedExportBatches(token)])
      .then(([availableData, claimedData]) => {
        setAvailable(availableData)
        setClaimed(claimedData)
        setStatus('ready')
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setStatus('unverified')
        }
      })
  }

  useEffect(load, [token])

  async function handleClaim(batchId: number) {
    if (!token) return
    setError(null)
    setClaimingId(batchId)
    try {
      await claimExportBatch(batchId, token)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('importerDashboard.claimError'))
    } finally {
      setClaimingId(null)
    }
  }

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
          ))}
        </div>
      </section>
    )
  }

  if (status === 'unverified') {
    return (
      <section className="mx-auto max-w-lg px-6 py-24 text-center">
        <ShieldCheck size={40} className="mx-auto text-leaf-600" />
        <h1 className="mt-4 text-xl font-semibold text-leaf-950">
          {t('importerDashboard.unverifiedTitle')}
        </h1>
        <p className="mt-2 text-sm text-leaf-950/60">{t('importerDashboard.unverifiedSubtitle')}</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
        {t('importerDashboard.title')}
      </h1>
      <p className="mt-1 text-sm text-leaf-950/60">{t('importerDashboard.subtitle')}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Package2 size={18} className="text-leaf-700" />
          <h2 className="text-sm font-semibold text-leaf-950">
            {t('importerDashboard.availableTitle')}
          </h2>
        </div>

        {available.length === 0 ? (
          <p className="mt-3 text-sm text-leaf-950/50">{t('importerDashboard.noneAvailable')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {available.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-leaf-950">
                    {b.crop_name} — {b.origin_country_name}
                  </p>
                  <p className="mt-1 text-xs text-leaf-950/60">
                    {t('importerDashboard.volume', { volume: b.total_volume })}
                  </p>
                  {b.certification_document_url && (
                    <a
                      href={b.certification_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
                    >
                      <FileText size={12} /> {t('importerDashboard.viewCertificate')}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleClaim(b.id)}
                  disabled={claimingId === b.id}
                  className="rounded-full bg-leaf-700 px-5 py-2 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                >
                  {claimingId === b.id
                    ? t('importerDashboard.claiming')
                    : t('importerDashboard.claimButton')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-leaf-950">{t('importerDashboard.claimedTitle')}</h2>
        {claimed.length === 0 ? (
          <p className="mt-3 text-sm text-leaf-950/50">{t('importerDashboard.noneClaimed')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {claimed.map((b) => (
              <div key={b.id} className="rounded-2xl border border-leaf-100 bg-white p-4">
                <p className="text-sm font-semibold text-leaf-950">
                  {b.crop_name} — {b.origin_country_name}
                </p>
                <p className="mt-1 text-xs text-leaf-950/60">
                  {t('importerDashboard.volume', { volume: b.total_volume })}
                </p>
                {b.contract_document_url && (
                  <a
                    href={b.contract_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-leaf-700 hover:text-leaf-800"
                  >
                    <FileText size={12} /> {t('importerDashboard.viewContract')}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
