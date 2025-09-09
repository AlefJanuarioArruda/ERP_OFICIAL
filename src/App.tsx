import React, { useState } from 'react'
import { AuthProvider } from './components/AuthProvider'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Customers } from './pages/Customers'
import { Sales } from './pages/Sales'
import { Finance } from './pages/Finance'
import { Reports } from './pages/Reports'
import { AIInsights } from './pages/AIInsights'
import { Settings } from './pages/Settings'
import { Pricing } from './pages/Pricing'
import { Success } from './pages/Success'
import { OnboardingScreen } from './components/auth/OnboardingScreen'
import { LoginScreen } from './components/auth/LoginScreen'
import { SignUpScreen } from './components/auth/SignUpScreen'
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen'
import { PasswordResetPage } from './components/auth/PasswordResetPage'
import { useAuth } from './hooks/useAuth'
import { useStripe } from './hooks/useStripe'

type AuthScreen = 'onboarding' | 'login' | 'signup' | 'forgot-password' | 'reset-password'

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth()
  const { getCurrentPlan } = useStripe()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [authScreen, setAuthScreen] = useState<AuthScreen>('onboarding')

  // Check URL parameters and hash for routing
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    
    if (urlParams.get('session_id') && window.location.pathname === '/') {
      setCurrentPage('success')
    }
  }, [])

  // Check for password reset hash
  React.useEffect(() => {
    const hash = window.location.hash
    
    // Check if it's a password reset link
    if (hash && hash.includes('#/reset-password')) {
      // Extract the actual recovery parameters after the route
      const hashParams = hash.split('?')[1] || hash.split('#')[2]
      if (hashParams && hashParams.includes('type=recovery') && hashParams.includes('access_token')) {
        setAuthScreen('reset-password')
      }
    }
  }, [])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  // Check for password reset link FIRST, before authentication check
  const hash = window.location.hash
  if (hash && hash.includes('#/reset-password') && hash.includes('type=recovery') && hash.includes('access_token')) {
    return (
      <PasswordResetPage
        onBack={() => {
          setAuthScreen('login')
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }}
      />
    )
  }

  // Show auth screens if user is not authenticated
  if (!isAuthenticated) {
    switch (authScreen) {
      case 'onboarding':
        return (
          <OnboardingScreen
            onGetStarted={() => setAuthScreen('login')}
          />
        )
      
      case 'login':
        return (
          <LoginScreen
            onBack={() => setAuthScreen('onboarding')}
            onSignUp={() => setAuthScreen('signup')}
            onForgotPassword={() => setAuthScreen('forgot-password')}
          />
        )
      
      case 'signup':
        return (
          <SignUpScreen
            onBack={() => setAuthScreen('login')}
            onLogin={() => setAuthScreen('login')}
          />
        )
      
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={() => setAuthScreen('login')}
          />
        )
      
      default:
        return (
          <OnboardingScreen
            onGetStarted={() => setAuthScreen('login')}
          />
        )
    }
  }

  // Main application for authenticated users
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'products':
        return <Products />
      case 'customers':
        return <Customers />
      case 'sales':
        return <Sales />
      case 'finance':
        return <Finance />
      case 'reports':
        return <Reports />
      case 'ai-insights':
        return <AIInsights />
      case 'settings':
        return <Settings />
      case 'pricing':
        return <Pricing />
      case 'success':
        return <Success />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App