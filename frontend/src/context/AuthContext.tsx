import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchMe,
  login as apiLogin,
  registerUser as apiRegister,
  type User,
  type UserRole,
} from '../api/client'

const TOKEN_KEY = 'agrilink_token'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    role: UserRole
    phone?: string
  }) => Promise<void>
  logout: () => void
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
    const res = await apiLogin({ email, password })
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
  }) {
    await apiRegister(data)
    await login(data.email, data.password)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
