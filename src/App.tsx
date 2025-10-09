import React, { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import { LandingLogin } from './pages/LandingLogin'
import { LandingSignUp } from './pages/LandingSignUp'
import { useAuth } from './hooks/useAuth'
import { useStripe } from './hooks/useStripe'

type AuthScreen = 'onboarding' | 'login' | 'signup' | 'forgot-password'

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth()
  const { getCurrentPlan, refetch } = useStripe()
  const [authScreen, setAuthScreen] = useState<AuthScreen>('onboarding')
  const location = useLocation()
  const navigate = useNavigate()

  // Force refresh subscription data when user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Small delay to ensure user session is fully established
      const timer = setTimeout(() => {
        refetch()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, refetch])

  // Check for password reset hash and set initial auth screen based on URL
  React.useEffect(() => {
    const hash = window.location.hash
    const pathname = location.pathname
    
    // Check if it's a password reset link
    if (hash && hash.includes('#/reset-password')) {
      // Extract the actual recovery parameters after the route
      const hashParams = hash.split('?')[1] || hash.split('#')[2]
      if (hashParams && hashParams.includes('type=recovery') && hashParams.includes('access_token')) {
        setAuthScreen('reset-password')
        return
      }
    }
    
    // Set auth screen based on current pathname
    if (pathname === '/login') {
      setAuthScreen('login')
    } else if (pathname === '/cadastro') {
      setAuthScreen('signup')
    } else if (pathname === '/esqueci-senha') {
      setAuthScreen('forgot-password')
    } else {
      setAuthScreen('onboarding')
    }
  }, [location.pathname])

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
    return (
      <Routes>
        <Route path="/login" element={
          <LoginScreen
            onBack={() => navigate('/')}
            onSignUp={() => navigate('/cadastro')}
            onForgotPassword={() => navigate('/esqueci-senha')}
          />
        } />
        <Route path="/cadastro" element={
          <SignUpScreen
            onBack={() => navigate('/login')}
            onLogin={() => navigate('/login')}
          />
        } />
        <Route path="/esqueci-senha" element={
          <ForgotPasswordScreen
            onBack={() => navigate('/login')}
          />
        } />
        <Route path="/reset-password" element={
          <PasswordResetPage
            onBack={() => navigate('/login')}
          />
        } />
        <Route path="*" element={
          <OnboardingScreen
            onGetStarted={() => navigate('/login')}
          />
        } />
      </Routes>
    )
  }

  // Main application for authenticated users
  if (isAuthenticated) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success" element={<Success />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    )
  }

  // This should never be reached due to the logic above
  return null
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App