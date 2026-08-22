import { useState } from 'react'
import { MailWarning } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

export default function EmailVerificationBanner() {
  const { t } = useTranslation()
  const { user, resendVerification } = useAuth()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!user || !user.email || user.email_verified) return null

  async function handleResend() {
    setStatus('sending')
    setError(null)
    try {
      await resendVerification()
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : t('profile.resendVerificationError'))
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-earth-100 px-4 py-2 text-center text-sm text-earth-800">
      <MailWarning size={16} className="shrink-0" />
      <span>{t('profile.emailNotVerified')}</span>
      {status === 'sent' ? (
        <span className="font-medium">{t('profile.resendVerificationSent')}</span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'sending'}
          className="font-semibold underline underline-offset-2 hover:text-earth-900 disabled:opacity-60"
        >
          {status === 'sending'
            ? t('profile.resendVerificationSending')
            : t('profile.resendVerificationButton')}
        </button>
      )}
      {error && <span>{error}</span>}
    </div>
  )
}
