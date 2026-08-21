import { useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { colors } from '../theme/colors'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

const FACEBOOK_DISCOVERY = {
  authorizationEndpoint: 'https://www.facebook.com/v21.0/dialog/oauth',
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
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)

  const googleClientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID
  const redirectUri = AuthSession.makeRedirectUri()

  const [googleRequest, , promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId ?? '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY,
  )

  const [facebookRequest, , promptFacebookAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID ?? '',
      scopes: ['public_profile', 'email'],
      redirectUri,
      usePKCE: false,
    },
    FACEBOOK_DISCOVERY,
  )

  async function handleGoogle() {
    if (!googleClientId) return
    setLoading('google')
    try {
      const result = await promptGoogleAsync()
      if (result.type !== 'success') {
        setLoading(null)
        return
      }
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: googleClientId,
          code: result.params.code,
          redirectUri,
          extraParams: googleRequest?.codeVerifier
            ? { code_verifier: googleRequest.codeVerifier }
            : undefined,
        },
        GOOGLE_DISCOVERY,
      )
      if (!tokenResponse.idToken) throw new Error('missing id_token')
      await loginWithGoogle(tokenResponse.idToken)
      onSuccess()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t('login.googleError'))
    } finally {
      setLoading(null)
    }
  }

  async function handleFacebook() {
    if (!FACEBOOK_APP_ID) return
    setLoading('facebook')
    try {
      const result = await promptFacebookAsync()
      if (result.type !== 'success') {
        setLoading(null)
        return
      }
      await loginWithFacebook({ code: result.params.code, redirect_uri: redirectUri })
      onSuccess()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t('login.facebookError'))
    } finally {
      setLoading(null)
    }
  }

  if (!googleClientId && !FACEBOOK_APP_ID) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>{t('login.orContinueWith')}</Text>
        <View style={styles.line} />
      </View>

      {googleClientId && (
        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogle}
          disabled={!googleRequest || loading !== null}
        >
          {loading === 'google' ? (
            <ActivityIndicator color={colors.leaf950} />
          ) : (
            <Text style={styles.googleButtonText}>{t('login.continueWithGoogle')}</Text>
          )}
        </Pressable>
      )}

      {FACEBOOK_APP_ID && (
        <Pressable
          style={[styles.button, styles.facebookButton]}
          onPress={handleFacebook}
          disabled={!facebookRequest || loading !== null}
        >
          {loading === 'facebook' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.facebookButtonText}>{t('login.continueWithFacebook')}</Text>
          )}
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    gap: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.leaf100,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(15,36,17,0.4)',
    textTransform: 'uppercase',
  },
  button: {
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.leaf200,
    backgroundColor: '#fff',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.leaf950,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  facebookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
