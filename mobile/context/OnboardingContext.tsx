import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const ONBOARDED_KEY = 'agrilink.onboarded'

type OnboardingContextValue = {
  onboarded: boolean
  loading: boolean
  completeOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((stored) => {
      setOnboarded(stored === 'true')
      setLoading(false)
    })
  }, [])

  function completeOnboarding() {
    AsyncStorage.setItem(ONBOARDED_KEY, 'true')
    setOnboarded(true)
  }

  return (
    <OnboardingContext.Provider value={{ onboarded, loading, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider')
  return ctx
}
