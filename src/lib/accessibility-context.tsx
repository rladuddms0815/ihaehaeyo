import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type FontSize = 'normal' | 'large' | 'xlarge'

interface AccessibilityContextType {
  fontSize: FontSize
  highContrast: boolean
  voiceSpeed: number
  simplifiedMode: boolean
  setFontSize: (size: FontSize) => void
  setHighContrast: (enabled: boolean) => void
  setVoiceSpeed: (speed: number) => void
  setSimplifiedMode: (enabled: boolean) => void
  announce: (message: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

const STORAGE_KEY = 'accessibility_settings'

const defaultSettings = {
  fontSize: 'large' as FontSize,
  highContrast: false,
  voiceSpeed: 0.8,
  simplifiedMode: true,
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(defaultSettings.fontSize)
  const [highContrast, setHighContrastState] = useState(defaultSettings.highContrast)
  const [voiceSpeed, setVoiceSpeedState] = useState(defaultSettings.voiceSpeed)
  const [simplifiedMode, setSimplifiedModeState] = useState(defaultSettings.simplifiedMode)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFontSizeState(parsed.fontSize || defaultSettings.fontSize)
        setHighContrastState(parsed.highContrast ?? defaultSettings.highContrast)
        setVoiceSpeedState(parsed.voiceSpeed ?? defaultSettings.voiceSpeed)
        setSimplifiedModeState(parsed.simplifiedMode ?? defaultSettings.simplifiedMode)
      } catch {
        console.error('Failed to parse accessibility settings')
      }
    }
  }, [])

  useEffect(() => {
    const settings = { fontSize, highContrast, voiceSpeed, simplifiedMode }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [fontSize, highContrast, voiceSpeed, simplifiedMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('high-contrast', 'font-size-xlarge', 'font-size-large')

    if (highContrast) {
      root.classList.add('high-contrast')
    }
    if (fontSize === 'xlarge') {
      root.classList.add('font-size-xlarge')
    }
    if (fontSize === 'large') {
      root.classList.add('font-size-large')
    }
  }, [fontSize, highContrast])

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size)
  }, [])

  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled)
  }, [])

  const setVoiceSpeed = useCallback((speed: number) => {
    setVoiceSpeedState(speed)
  }, [])

  const setSimplifiedMode = useCallback((enabled: boolean) => {
    setSimplifiedModeState(enabled)
  }, [])

  const announce = useCallback((message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = 'ko-KR'
      utterance.rate = voiceSpeed
      window.speechSynthesis.speak(utterance)
    }
  }, [voiceSpeed])

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        highContrast,
        voiceSpeed,
        simplifiedMode,
        setFontSize,
        setHighContrast,
        setVoiceSpeed,
        setSimplifiedMode,
        announce,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}
