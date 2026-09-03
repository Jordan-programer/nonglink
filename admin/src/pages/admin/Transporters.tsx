import { useEffect, useState } from 'react'
import { CheckCircle2, Truck, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  fetchPendingTransporters,
  verifyTransporter,
  type TransporterDocumentType,
  type TransporterProfile,
} from '../../api/client'

const DOCUMENT_TYPES: TransporterDocumentType[] = [
  'driver_license',
  'vehicle_registration',
  'insurance',
  'inspection',
]

export default function Transporters() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [transporters, setTransporters] = useState<TransporterProfile[]>([])
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

  function load() {
    if (!token) return
    fetchPendingTransporters(token).then((data) => {
      setTransporters(data)
      setStatus('ready')
    })
  }

  useEffect(load, [token])

  async function handleDecision(userId: number, decision: 'approved' | 'rejected') {
    if (!token) return
    setError(null)
    setSavingId(userId)
    try {
      await verifyTransporter(userId, decision, token)
      setTransporters((prev) => prev.filter((p) => p.user_id !== userId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminTransporters.decisionError'))
    } finally {
      setSavingId(null)
    }
  }

  const documentLabels: Record<TransporterDocumentType, string> = {
    driver_license: t('adminTransporters.docDriverLicense'),
    vehicle_registration: t('adminTransporters.docVehicleRegistration'),
    insurance: t('adminTransporters.docInsurance'),
    inspection: t('adminTransporters.docInspection'),
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-leaf-50" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Truck size={18} className="text-leaf-700" />
        <h2 className="text-lg font-semibold text-leaf-950">{t('adminTransporters.title')}</h2>
      </div>
      <p className="mt-1 text-sm text-leaf-950/50">{t('adminTransporters.subtitle')}</p>

      {error && (
        <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{error}</p>
      )}

      {transporters.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-leaf-100 bg-leaf-50 p-8 text-center text-sm text-leaf-950/60">
          {t('adminTransporters.noPending')}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {transporters.map((profile) => (
            <div key={profile.id} className="rounded-2xl border border-leaf-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-leaf-950">{profile.user_name}</p>
                  <p className="text-xs text-leaf-950/60">{profile.user_email}</p>
                  {profile.vehicle ? (
                    <p className="mt-1 text-xs text-leaf-950/70">
                      {t('adminTransporters.vehicleSummary', {
                        type: profile.vehicle.vehicle_type,
                        plate: profile.vehicle.plate,
                        capacity: profile.vehicle.capacity_kg,
                      })}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-earth-700">{t('adminTransporters.noVehicle')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(profile.user_id, 'approved')}
                    disabled={savingId === profile.user_id}
                    className="flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> {t('adminTransporters.approve')}
                  </button>
                  <button
                    onClick={() => handleDecision(profile.user_id, 'rejected')}
                    disabled={savingId === profile.user_id}
                    className="flex items-center gap-1.5 rounded-full border border-earth-300 px-4 py-2 text-xs font-semibold text-earth-700 hover:bg-earth-50 disabled:opacity-60"
                  >
                    <XCircle size={14} /> {t('adminTransporters.reject')}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DOCUMENT_TYPES.map((type) => {
                  const doc = profile.documents.find((d) => d.document_type === type)
                  return (
                    <div key={type} className="text-center">
                      {doc ? (
                        <img
                          src={doc.file_url}
                          alt={documentLabels[type]}
                          className="h-20 w-full rounded-lg border border-leaf-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-leaf-200 bg-leaf-50 text-xs text-leaf-950/40">
                          {t('adminTransporters.missing')}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-leaf-950/60">{documentLabels[type]}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
