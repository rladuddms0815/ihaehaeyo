import { ReactNode, useEffect } from 'react'
import { AccessibilityProvider } from './lib/accessibility-context'
import { SessionProvider, useSession } from './lib/session-context'
import { VoiceProvider } from './lib/voice-context'
import { RouterProvider, useRouter, Route } from './lib/router'

// Pages
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import Dashboard from './pages/Dashboard'
import ScanPage from './pages/ScanPage'
import ExplanationPage from './pages/ExplanationPage'
import VoicePage from './pages/VoicePage'
import FamilyPage from './pages/FamilyPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import DocumentsPage from './pages/DocumentsPage'
import HelpPage from './pages/HelpPage'
import ScamCheckPage from './pages/ScamCheckPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isOnboarded, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      router.navigate('/onboarding')
    }
  }, [isLoading, isOnboarded, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 animate-pulse mx-auto mb-4" />
          <p className="text-elder-base text-neutral-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isOnboarded) {
    return null
  }

  return <>{children}</>
}

function RootRoute() {
  const { isOnboarded, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isOnboarded) {
      router.navigate('/dashboard')
    }
  }, [isLoading, isOnboarded, router])

  if (isLoading || isOnboarded) {
    return null
  }

  return <LandingPage />
}

function AppRoutes() {
  const { route } = useRouter()

  const routes: Record<Route, ReactNode> = {
    '/': <RootRoute />,
    '/onboarding': <OnboardingPage />,
    '/dashboard': <ProtectedRoute><Dashboard /></ProtectedRoute>,
    '/scan': <ProtectedRoute><ScanPage /></ProtectedRoute>,
    '/explanation': <ProtectedRoute><ExplanationPage /></ProtectedRoute>,
    '/voice': <ProtectedRoute><VoicePage /></ProtectedRoute>,
    '/family': <ProtectedRoute><FamilyPage /></ProtectedRoute>,
    '/chat': <ProtectedRoute><ChatPage /></ProtectedRoute>,
    '/settings': <ProtectedRoute><SettingsPage /></ProtectedRoute>,
    '/documents': <ProtectedRoute><DocumentsPage /></ProtectedRoute>,
    '/help': <ProtectedRoute><HelpPage /></ProtectedRoute>,
    '/scam-check': <ProtectedRoute><ScamCheckPage /></ProtectedRoute>,
  }

  return routes[route] || <LandingPage />
}

function App() {
  return (
    <AccessibilityProvider>
      <SessionProvider>
        <VoiceProvider>
          <RouterProvider>
            <AppRoutes />
          </RouterProvider>
        </VoiceProvider>
      </SessionProvider>
    </AccessibilityProvider>
  )
}

export default App
