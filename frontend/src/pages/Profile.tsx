import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Camera, KeyRound, Mail, Phone, User as UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError, updatePassword, updateProfile, uploadProfilePhoto } from '../api/client'

export default function Profile() {
  const { t } = useTranslation()
  const { user, token, updateUser } = useAuth()

  const roleLabels: Record<string, string> = {
    farmer: t('profile.roleFarmer'),
    buyer: t('profile.roleBuyer'),
    distributor: t('profile.roleDistributor'),
    transporter: t('profile.roleTransporter'),
    admin: t('profile.roleAdmin'),
  }

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  if (!user || !token) return null

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const updated = await updateProfile(
        { name, email, phone: phone || undefined, bio: bio || undefined },
        token!,
      )
      updateUser(updated)
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : t('profile.profileError'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setPhotoError(null)
    setUploadingPhoto(true)
    try {
      const updated = await uploadProfilePhoto(file, token!)
      updateUser(updated)
    } catch (err) {
      setPhotoError(err instanceof ApiError ? err.message : t('profile.photoError'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'))
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword(
        { current_password: currentPassword, new_password: newPassword },
        token!,
      )
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : t('profile.passwordError'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-leaf-50 to-cream-50 py-16">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-leaf-200/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-md space-y-6 px-6">
        <div className="rounded-3xl border border-leaf-100 bg-white/90 p-8 shadow-xl shadow-leaf-950/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <label className="group relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-leaf-100 text-leaf-700">
              {user.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon size={20} />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={16} className="text-white" />
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-leaf-950">
                {t('profile.title')}
              </h1>
              <span className="inline-flex rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-medium text-leaf-700">
                {roleLabels[user.role] ?? user.role}
              </span>
            </div>
          </div>
          {uploadingPhoto && (
            <p className="mt-2 text-xs text-leaf-950/50">{t('profile.uploadingPhoto')}</p>
          )}
          {photoError && (
            <p className="mt-2 text-xs text-earth-700">{photoError}</p>
          )}

          <form className="mt-7 space-y-4" onSubmit={handleProfileSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.fullName')}</span>
              <div className="relative mt-1.5">
                <UserIcon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.email')}</span>
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
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.phone')}</span>
              <div className="relative mt-1.5">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leaf-950/40"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('profile.phonePlaceholder')}
                  className="w-full rounded-xl border border-leaf-200 bg-white py-2.5 pl-9 pr-4 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.bio')}</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('profile.bioPlaceholder')}
                maxLength={300}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
              />
              <span className="mt-1 block text-right text-xs text-leaf-950/40">
                {bio.length}/300
              </span>
            </label>

            {profileError && (
              <p className="rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                {profileError}
              </p>
            )}
            {profileSaved && (
              <p className="rounded-lg bg-leaf-100 px-3 py-2 text-sm text-leaf-800">
                {t('profile.profileUpdated')}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-full bg-leaf-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-leaf-700/25 transition-colors hover:bg-leaf-800 disabled:opacity-60"
            >
              {savingProfile ? t('profile.savingChanges') : t('profile.saveChanges')}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-leaf-100 bg-white/90 p-8 shadow-xl shadow-leaf-950/10 backdrop-blur">
          <div className="flex items-center gap-2 text-leaf-800">
            <KeyRound size={18} />
            <h2 className="text-lg font-semibold text-leaf-950">{t('profile.changePassword')}</h2>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.currentPassword')}</span>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.newPassword')}</span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.newPasswordPlaceholder')}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 placeholder:text-leaf-950/40 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-leaf-950/80">{t('profile.confirmNewPassword')}</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-leaf-200 bg-white px-3.5 py-2.5 text-sm text-leaf-950 focus:border-leaf-400 focus:outline-none"
              />
            </label>

            {passwordError && (
              <p className="rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-800">
                {passwordError}
              </p>
            )}
            {passwordSaved && (
              <p className="rounded-lg bg-leaf-100 px-3 py-2 text-sm text-leaf-800">
                {t('profile.passwordChanged')}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full rounded-full border border-leaf-300 px-6 py-3 text-sm font-semibold text-leaf-900 transition-colors hover:bg-leaf-100 disabled:opacity-60"
            >
              {savingPassword ? t('profile.changingPassword') : t('profile.changePasswordButton')}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
