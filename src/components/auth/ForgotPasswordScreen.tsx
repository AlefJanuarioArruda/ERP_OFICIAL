import React, { useState } from 'react'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface ForgotPasswordScreenProps {
  onBack: () => void
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await resetPassword(email)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Erro ao enviar email')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Enviado!</h1>
            <p className="text-gray-600 mb-8">
              Enviamos um link seguro para redefinir sua senha para:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-blue-900">{email}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">📧 Próximos Passos:</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>1. Verifique sua caixa de entrada</p>
                <p>2. Clique no link "Redefinir Senha"</p>
                <p>3. Crie sua nova senha</p>
                <p>4. Será automaticamente logado</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              <strong>⚠️ Não encontrou o email?</strong> Verifique sua pasta de spam ou lixo eletrônico.
            </p>
            
            <button
              onClick={onBack}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Voltar ao Login
            </button>
            
            <p className="text-xs text-gray-400 mt-4">
              Precisa de ajuda? Entre em contato conosco pelo suporte.
            </p>
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
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
            <p className="text-gray-600">
              Digite seu email e enviaremos um link seguro para redefinir sua senha
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email da Conta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite o email da sua conta"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enviando Link...
                </div>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Mail className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Como Funciona</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Você receberá um email com link seguro</p>
              <p>2. Clique no link para abrir a página de redefinição</p>
              <p>3. Digite sua nova senha</p>
              <p>4. Faça login com a nova senha</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ⏰ O link expira em 1 hora por segurança
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
              Voltar ao login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}