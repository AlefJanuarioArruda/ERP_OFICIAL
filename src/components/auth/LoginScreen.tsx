import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Brain, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface LoginScreenProps {
  onSignUp: () => void
  onForgotPassword: () => void
  onBack?: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onSignUp, 
  onForgotPassword,
  onBack 
}) => {
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!formData.email.trim()) {
      setError('Por favor, digite seu email')
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError('Por favor, digite sua senha')
      setLoading(false)
      return
    }

    const result = await signIn(formData.email, formData.password)
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login')
    }
    
    setLoading(false)
  }

  const isInvalidCredentialsError = error.includes('Email ou senha incorretos')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h1>
            <p className="text-gray-600">Entre na sua conta para continuar</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-600 text-sm font-medium mb-1">{error}</p>
                  {isInvalidCredentialsError && (
                    <div className="text-red-600 text-xs space-y-1">
                      <p>• Verifique se o email está correto</p>
                      <p>• Certifique-se de que a senha está correta</p>
                      <p>• Se esqueceu sua senha, use "Esqueci minha senha"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (error) setError('') // Clear error when user starts typing
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (error) setError('') // Clear error when user starts typing
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <button
                onClick={onSignUp}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Cadastre-se grátis
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Ao entrar, você concorda com nossos</p>
          <div className="space-x-4">
            <a href="#" className="hover:text-gray-700 transition-colors">Termos de Uso</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  )
}