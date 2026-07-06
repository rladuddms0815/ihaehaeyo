import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface UserProfile {
  id: string
  name: string
  dateOfBirth: string
  caregiverPhone: string
  createdAt: string
}

export interface OnboardingInput {
  name: string
  dateOfBirth: string
  caregiverPhone?: string
}

export interface ProfileUpdateInput {
  name: string
  dateOfBirth: string
  caregiverPhone?: string
}

interface SessionContextType {
  profile: UserProfile | null
  isOnboarded: boolean
  isLoading: boolean
  completeOnboarding: (input: OnboardingInput) => void
  updateProfile: (input: ProfileUpdateInput) => void
  resetProfile: () => void
}

const SessionContext = createContext<SessionContextType | null>(null)

export const PROFILE_STORAGE_KEY = 'ihaehaeyo_user_profile'

function generateUserId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `user_${crypto.randomUUID()}`
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) {
        setProfile(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(PROFILE_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const completeOnboarding = (input: OnboardingInput) => {
    const newProfile: UserProfile = {
      id: generateUserId(),
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
      caregiverPhone: input.caregiverPhone?.trim() || '',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile))
    setProfile(newProfile)
  }

  const updateProfile = (input: ProfileUpdateInput) => {
    if (!profile) return
    const updated: UserProfile = {
      ...profile,
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
      caregiverPhone: input.caregiverPhone?.trim() || '',
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
    setProfile(updated)
  }

  const resetProfile = () => {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    setProfile(null)
  }

  return (
    <SessionContext.Provider
      value={{
        profile,
        isOnboarded: !!profile,
        isLoading,
        completeOnboarding,
        updateProfile,
        resetProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}

export function useRequireAuth() {
  const { isOnboarded, isLoading } = useSession()
  return { isOnboarded, isLoading }
}
