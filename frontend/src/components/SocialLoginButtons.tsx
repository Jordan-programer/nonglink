import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number },
          ) => void
        }
      }
    }
    FB?: {
      init: (config: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void
      login: (
        callback: (response: {
          status: string
          authResponse?: { accessToken: string }
        }) => void,
        options?: { scope: string },
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

let googleSdkPromise: Promise<void> | null = null

function loadGoogleSdk(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!googleSdkPromise) googleSdkPromise = loadScript('https://accounts.google.com/gsi/client')
  return googleSdkPromise
}

let facebookSdkPromise: Promise<void> | null = null

function loadFacebookSdk(): Promise<void> {
  if (window.FB) return Promise.resolve()
  if (!facebookSdkPromise) {
    facebookSdkPromise = new Promise((resolve) => {
      window.fbAsyncInit = () => {
        window.FB!.init({ appId: FACEBOOK_APP_ID!, cookie: true, xfbml: false, version: 'v21.0' })
        resolve()
      }
    })
    loadScript('https://connect.facebook.net/pt_PT/sdk.js').catch(() => {})
  }
  return facebookSdkPromise
}

export default function SocialLoginButtons({
  onSuccess,
  onError,
}: {
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation()
  const { loginWithGoogle, loginWithFacebook } = useAuth()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [facebookLoading, setFacebookLoading] = useState(false)

  // Kept fresh on every render but read via ref inside the effect below, so
  // the effect itself only depends on [] and initializes the Google button
  // exactly once per mount. Depending on onSuccess/onError/loginWithGoogle
  // directly re-ran google.accounts.id.initialize()/renderButton() on every
  // parent re-render (they're new function identities each time), stacking
  // duplicate button instances in the same container and causing the
  // in-flight credential to bind to a stale/torn-down instance.
  const latest = useRef({ loginWithGoogle, onSuccess, onError, t })
  useEffect(() => {
    latest.current = { loginWithGoogle, onSuccess, onError, t }
  })

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return
    let cancelled = false

    loadGoogleSdk().then(() => {
      if (cancelled || !window.google || !googleButtonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await latest.current.loginWithGoogle(response.credential)
            latest.current.onSuccess()
          } catch (err) {
            latest.current.onError(
              err instanceof ApiError ? err.message : latest.current.t('login.googleError'),
            )
          }
        },
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      })
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFacebookClick() {
    if (!FACEBOOK_APP_ID) return
    setFacebookLoading(true)
    try {
      await loadFacebookSdk()
      window.FB!.login(async (response) => {
        if (response.status !== 'connected' || !response.authResponse) {
          setFacebookLoading(false)
          return
        }
        try {
          await loginWithFacebook(response.authResponse.accessToken)
          onSuccess()
        } catch (err) {
          onError(err instanceof ApiError ? err.message : t('login.facebookError'))
        } finally {
          setFacebookLoading(false)
        }
      }, { scope: 'email' })
    } catch {
      setFacebookLoading(false)
      onError(t('login.facebookError'))
    }
  }

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-leaf-100" />
        <span className="text-xs font-medium uppercase tracking-wide text-leaf-950/40">
          {t('login.orContinueWith')}
        </span>
        <div className="h-px flex-1 bg-leaf-100" />
      </div>

      {GOOGLE_CLIENT_ID && <div ref={googleButtonRef} className="flex justify-center" />}

      {FACEBOOK_APP_ID && (
        <button
          type="button"
          onClick={handleFacebookClick}
          disabled={facebookLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-leaf-200 bg-white px-6 py-2.5 text-sm font-semibold text-leaf-950 transition-colors hover:bg-leaf-50 disabled:opacity-60"
        >
          {facebookLoading ? t('login.facebookLoading') : t('login.continueWithFacebook')}
        </button>
      )}
    </div>
  )
}
