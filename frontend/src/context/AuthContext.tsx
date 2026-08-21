import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchMe,
  login as apiLogin,
  loginWithFacebook as apiLoginWithFacebook,
  loginWithGoogle as apiLoginWithGoogle,
  registerUser as apiRegister,
  resendVerificationEmail as apiResendVerificationEmail,
  verifyEmail as apiVerifyEmail,
  type User,
  type UserRole,
} from '../api/client'

const TOKEN_KEY = 'agrilink_token'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  loginWithFacebook: (accessToken: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    role: UserRole
    phone?: string
    region_id: number
  }) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  verifyEmailToken: (token: string) => Promise<void>
  resendVerification: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    fetchMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function login(email: string, password: string) {
    const res = await apiLogin({ identifier: email, password })
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  async function loginWithGoogle(idToken: string) {
    const res = await apiLoginWithGoogle(idToken)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  async function loginWithFacebook(accessToken: string) {
    const res = await apiLoginWithFacebook(accessToken)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  async function register(data: {
    name: string
    email: string
    password: string
    role: UserRole
    phone?: string
    region_id: number
  }) {
    await apiRegister(data)
    await login(data.email, data.password)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  async function verifyEmailToken(verificationToken: string) {
    const res = await apiVerifyEmail(verificationToken)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  async function resendVerification() {
    if (!token) throw new Error('Not authenticated')
    await apiResendVerificationEmail(token)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        loginWithFacebook,
        register,
        logout,
        updateUser: setUser,
        verifyEmailToken,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
