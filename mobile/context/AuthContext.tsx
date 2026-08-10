import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchMe,
  login as apiLogin,
  registerUser as apiRegister,
  type User,
  type UserRole,
} from '../lib/api'

const TOKEN_KEY = 'agrilink_token'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email?: string
    phone?: string
    password: string
    role: UserRole
    region_id: number
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((stored) => {
      if (stored) setToken(stored)
      else setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!token) return

    fetchMe(token)
      .then(setUser)
      .catch(() => {
        AsyncStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function login(identifier: string, password: string) {
    const res = await apiLogin({ identifier, password })
    await AsyncStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  async function register(data: {
    name: string
    email?: string
    phone?: string
    password: string
    role: UserRole
    region_id: number
  }) {
    await apiRegister(data)
    await login((data.email || data.phone)!, data.password)
  }

  function logout() {
    AsyncStorage.removeItem(TOKEN_KEY)
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
