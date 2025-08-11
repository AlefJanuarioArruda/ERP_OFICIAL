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

  // Extrai access token do hash da URL ao montar o componente
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      const type = params.get('type')
      
      if (token && type === 'recovery') {
        setAccessToken(token)
        // Busca email do usuário usando o token de recuperação para auto-login
        getUserEmailFromToken(token)
        // Limpa URL para evitar token exposto na barra
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
      console.error('Erro ao obter usuário pelo token:', error)
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
      // Usando a API do Supabase para redefinir a senha com o accessToken
      const { user, error: updateError } = await supabase.auth.update({
        password: formData.password
      })

      if (!updateError && user) {
        setSuccess(true)

        // Auto-login após reset de senha
        if (userEmail) {
          setLoggingIn(true)

          setTimeout(async () => {
            const loginResult = await signIn(userEmail, formData.password)

            if (loginResult.success) {
              console.log('Login automático realizado com sucesso')
            } else {
              setTimeout(() => {
                onBack()
              }, 2000)
            }
            setLoggingIn(false)
          }, 1000)
        } else {
          setTimeout(() => {
            onBack()
          }, 3000)
        }
      } else {
        console.error('Erro ao redefinir senha:', updateError)
        setError(`Erro ao redefinir senha: ${updateError?.message || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro inesperado ao redefinir senha:', error)
      setError(`Erro inesperado ao redefinir senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

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
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Redefinir Senha</h1>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center mb-4">
              <AlertCircle className="inline-block mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 font-semibold mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 font-semibold mb-2">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}