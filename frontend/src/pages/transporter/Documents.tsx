import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CheckCircle2, Clock3, FileText, Truck, Upload, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  ApiError,
  fetchMyTransporterProfile,
  submitVehicle,
  uploadTransporterDocument,
  type TransporterDocumentType,
  type TransporterProfile,
} from '../../api/client'

const DOCUMENT_TYPES: TransporterDocumentType[] = [
  'driver_license',
  'vehicle_registration',
  'insurance',
  'inspection',
]

export default function TransporterDocuments() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [profile, setProfile] = useState<TransporterProfile | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [capacityKg, setCapacityKg] = useState('')
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [savingVehicle, setSavingVehicle] = useState(false)

  const [uploadingType, setUploadingType] = useState<TransporterDocumentType | null>(null)
  const [docError, setDocError] = useState<string | null>(null)

  function load() {
    if (!token) return
    fetchMyTransporterProfile(token).then((res) => {
      setProfile(res)
      if (res.vehicle) {
        setPlate(res.vehicle.plate)
        setVehicleType(res.vehicle.vehicle_type)
        setCapacityKg(String(res.vehicle.capacity_kg))
      }
      setStatus('ready')
    })
  }

  useEffect(load, [token])

  async function handleVehicleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setVehicleError(null)
    setSavingVehicle(true)
    try {
      const updated = await submitVehicle(
        { plate, vehicle_type: vehicleType, capacity_kg: Number(capacityKg) },
        token,
      )
      setProfile(updated)
    } catch (err) {
      setVehicleError(err instanceof ApiError ? err.message : t('transporterDocuments.vehicleError'))
    } finally {
      setSavingVehicle(false)
    }
  }

  async function handleDocumentChange(type: TransporterDocumentType, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return

    setDocError(null)
    setUploadingType(type)
    try {
      const updated = await uploadTransporterDocument(type, file, token)
      setProfile(updated)
    } catch (err) {
      setDocError(err instanceof ApiError ? err.message : t('transporterDocuments.docError'))
    } finally {
      setUploadingType(null)
    }
  }

  const statusStyles: Record<string, string> = {
    pending: 'bg-earth-100 text-earth-700',
    approved: 'bg-leaf-100 text-leaf-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const statusIcons: Record<string, typeof Clock3> = {
    pending: Clock3,
    approved: CheckCircle2,
    rejected: XCircle,
  }

  if (status === 'loading' || !profile) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-leaf-50" />
          ))}
        </div>
      </section>
    )
  }

  const StatusIcon = statusIcons[profile.verification_status]

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-leaf-950">
            {t('transporterDocuments.title')}
          </h1>
          <p className="mt-1 text-sm text-leaf-950/60">{t('transporterDocuments.subtitle')}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[profile.verification_status]}`}
        >
          <StatusIcon size={14} />
          {t(`transporterDocuments.status.${profile.verification_status}`)}
        </span>
      </div>

      {profile.verification_status === 'pending' && (
        <p className="mt-4 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
          {t('transporterDocuments.pendingNotice')}
        </p>
      )}
      {profile.verification_status === 'rejected' && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {t('transporterDocuments.rejectedNotice')}
        </p>
      )}

      {/* Vehicle */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <Truck size={18} className="text-leaf-700" /> {t('transporterDocuments.vehicleTitle')}
        </h2>

        <form
          onSubmit={handleVehicleSubmit}
          className="mt-4 grid gap-4 rounded-2xl border border-leaf-100 bg-white p-5 sm:grid-cols-3"
        >
          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('transporterDocuments.plate')}</span>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('transporterDocuments.vehicleType')}</span>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder={t('transporterDocuments.vehicleTypePlaceholder')}
              required
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-leaf-950/80">{t('transporterDocuments.capacity')}</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
            />
          </label>

          {vehicleError && (
            <p className="sm:col-span-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
              {vehicleError}
            </p>
          )}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={savingVehicle}
              className="rounded-full bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-800 disabled:opacity-60"
            >
              {savingVehicle ? t('transporterDocuments.saving') : t('transporterDocuments.saveVehicle')}
            </button>
          </div>
        </form>
      </div>

      {/* Documents */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-leaf-950">
          <FileText size={18} className="text-leaf-700" /> {t('transporterDocuments.documentsTitle')}
        </h2>
        <p className="mt-1 text-sm text-leaf-950/60">{t('transporterDocuments.documentsSubtitle')}</p>

        {docError && (
          <p className="mt-3 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">{docError}</p>
        )}

        <div className="mt-4 space-y-3">
          {DOCUMENT_TYPES.map((type) => {
            const existing = profile.documents.find((d) => d.document_type === type)
            return (
              <div
                key={type}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  {existing ? (
                    <img
                      src={existing.file_url}
                      alt={t(`transporterDocuments.types.${type}`)}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-leaf-50 text-leaf-700/50">
                      <FileText size={20} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-leaf-950">
                      {t(`transporterDocuments.types.${type}`)}
                    </p>
                    <p className="text-xs text-leaf-950/60">
                      {existing ? t('transporterDocuments.uploaded') : t('transporterDocuments.notUploaded')}
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-800">
                  <Upload size={14} />
                  {uploadingType === type
                    ? t('transporterDocuments.uploading')
                    : existing
                      ? t('transporterDocuments.replace')
                      : t('transporterDocuments.upload')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleDocumentChange(type, e)}
                    disabled={uploadingType !== null}
                    className="hidden"
                  />
                </label>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
