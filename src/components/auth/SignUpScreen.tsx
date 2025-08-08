import React, { useState } from 'react'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Brain, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SignUpScreenProps {
  onBack: () => void
  onLogin: () => void
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onLogin }) => {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido'
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    const result = await signUp(formData.name, formData.email, formData.password)
    
    if (!result.success) {
      setError(result.error || 'Erro ao criar conta')
    }
    
    setLoading(false)
  }

  const isUserExistsError = error.includes('já está cadastrado')

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

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Comece a usar o ERP Smart hoje mesmo</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-600 text-sm font-medium mb-1">{error}</p>
                  {isUserExistsError && (
                    <div className="mt-2">
                      <button
                        onClick={onLogin}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ir para a tela de login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' })
                    }
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                  required
                  autoComplete="name"
                />
              </div>
              {validationErrors.name && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: '' })
                    }
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' })
                    }
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
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
              {validationErrors.password && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
              )}
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
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (validationErrors.confirmPassword) {
                      setValidationErrors({ ...validationErrors, confirmPassword: '' })
                    }
                    if (error) setError('')
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
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
              {validationErrors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Criando conta...
                </div>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <button
                onClick={onLogin}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Ao criar uma conta, você concorda com nossos</p>
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