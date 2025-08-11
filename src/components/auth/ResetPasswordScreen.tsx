import React, { useState, useEffect } from 'react'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Brain } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

interface ResetPasswordScreenProps {
  onBack: () => void
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack }) => {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // Extract access token from URL hash on component mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      const type = params.get('type')
      
      if (token && type === 'recovery') {
        setAccessToken(token)
        // Get user email from the token to use for auto-login
        getUserEmailFromToken(token)
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  const getUserEmailFromToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user?.email) {
        setUserEmail(user.email)
      }
    } catch (error) {
      console.error('Error getting user from token:', error)
    }
  }

  const validateForm = () => {
    if (!formData.password) {
      setError('Nova senha é obrigatória')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!accessToken) {
      setError('Token de recuperação inválido ou expirado')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update password using Supabase auth directly with the recovery token
      const { error: updateError } = await supabase.auth.updateUser(
        { password: formData.password },
        { accessToken }
      )
      
      if (!updateError) {
        setSuccess(true)
        
        // Auto-login after password reset
        if (userEmail) {
          setLoggingIn(true)
          
          // Small delay to ensure password is updated
          setTimeout(async () => {
            const loginResult = await signIn(userEmail, formData.password)
            
            if (loginResult.success) {
              // User will be automatically redirected to dashboard by auth state change
              console.log('Auto-login successful')
            } else {
              // If auto-login fails, redirect to login page after showing success
              setTimeout(() => {
                onBack()
              }, 2000)
            }
            setLoggingIn(false)
          }, 1000)
        } else {
          // Fallback: redirect to login after 3 seconds if no email
          setTimeout(() => {
            onBack()
          }, 3000)
        }
      } else {
        console.error('Password reset error:', updateError)
        setError(`Erro ao redefinir senha: ${updateError.message}`)
      }
    } catch (error) {
      console.error('Unexpected password reset error:', error)
      setError(`Erro inesperado ao redefinir senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 Senha Redefinida com Sucesso!
            </h1>
            
            {loggingIn ? (
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">
                  Fazendo login automaticamente na sua conta...
                </p>
              </div>
            ) : (
              <p className="text-gray-600 mb-8">
                Sua senha foi alterada com sucesso! {userEmail ? 'Você será logado automaticamente.' : 'Você será redirecionado para o login.'}
              </p>
            )}
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold text-gray-900">ERP Smart</span>
              </div>
              <p className="text-sm text-gray-600">
                Bem-vindo de volta! Sua conta está segura e pronta para uso.
              </p>
            </div>
            
            {!loggingIn && (
              <button
                onClick={onBack}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                {userEmail ? 'Ir para o Sistema' : 'Ir para Login'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No access token - invalid or expired link
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Inválido ou Expirado</h1>
            <p className="text-gray-600 mb-8">
              Este link de recuperação de senha é inválido ou expirou. Links de recuperação são válidos por apenas 1 hora por motivos de segurança.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>💡 Dica:</strong> Solicite um novo link de recuperação na tela de login para continuar.
              </p>
            </div>
            
            <button
              onClick={onBack}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Solicitar Novo Link
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
            <p className="text-gray-600">
              Digite sua nova senha para acessar sua conta
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (error) setError('')
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite sua nova senha"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && formData.password.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Pelo menos 6 caracteres</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (error) setError('')
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirme sua nova senha"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password && (
                <div className="mt-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.password === formData.confirmPassword ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={
                      formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                    }>
                      {formData.password === formData.confirmPassword ? 'Senhas coincidem' : 'Senhas não coincidem'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Redefinindo Senha...
                </div>
              ) : (
                'Confirmar Nova Senha'
              )}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Lock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Segurança Garantida</span>
            </div>
            <p className="text-sm text-blue-800">
              Após confirmar sua nova senha, você será automaticamente logado e redirecionado para o sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Lembrou da senha?{' '}
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}