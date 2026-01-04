import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Brain, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SignUpScreenProps {
  onBack: () => void
  onLogin: () => void
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onLogin }) => {
  const { signUp } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Check URL search params for step
  const searchParams = new URLSearchParams(location.search)
  const urlStep = searchParams.get('step')
  const initialStep = urlStep === '2' ? 2 : 1
  const [step, setStep] = useState<1 | 2>(initialStep)

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

  // Step 1: Scarcity and Copy
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 -bottom-48 -right-48 animate-pulse delay-1000"></div>
        </div>

        <div className="w-full max-w-4xl relative z-10">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          {/* Floating WhatsApp Button */}
<a
  href="https://wa.me/5531991227789?text=Olá!%20Gostaria%20de%20falar%20com%20um%20consultor%20sobre%20a%20plataforma."
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-35 right-6 z-50 flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110"
  aria-label="Falar com consultor no WhatsApp"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className="w-8 h-8 fill-white"
  >
    <path d="M19.11 17.29c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.14.18 1.9 2.9 4.6 4.07.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z"/>
    <path d="M16 2.67c-7.36 0-13.33 5.97-13.33 13.33 0 2.35.61 4.64 1.77 6.66L2.67 29.33l6.86-1.8c1.95 1.06 4.14 1.62 6.47 1.62 7.36 0 13.33-5.97 13.33-13.33S23.36 2.67 16 2.67zm0 23.11c-2.08 0-4.11-.56-5.87-1.62l-.42-.25-4.07 1.07 1.09-3.97-.27-.43a10.47 10.47 0 0 1-1.62-5.64c0-5.77 4.7-10.47 10.47-10.47s10.47 4.7 10.47 10.47-4.7 10.47-10.47 10.47z"/>
  </svg>
</a>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 p-8 md:p-12">
            {/* Urgency Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-semibold text-sm">Oferta por tempo limitado</span>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Tenha controle real da sua <span className="text-blue-600">Produção</span> 
              </h1>
              
              <p className="text-xl text-gray-600 mb-6 mt-10">
                Chega de planilhas confusas e produções atrasadas. Tenha controle de seu estoque,faturamento e caixa. Tudo isso em um único lugar.
              </p>
             {/* Video YouTube */}
  <div className="mt-8 flex justify-center">
    <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe
        className="w-full h-full"
        src="https://www.youtube.com/embed/r3rS52FDgTA"
        title="Apresentação da Plataforma"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        
      />
    </div>
  </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Acesso Completo Grátis</h3>
                    <p className="text-gray-600 text-sm">Todas as funcionalidades premium liberadas por 30 dias</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">IA Avançada Incluída</h3>
                    <p className="text-gray-600 text-sm">Insights e previsões inteligentes para seu negócio</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Sem Cartão de Crédito</h3>
                    <p className="text-gray-600 text-sm">Zero compromisso. Cancele quando quiser</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Suporte Prioritário</h3>
                    <p className="text-gray-600 text-sm">Equipe dedicada para ajudar você a começar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"></div>
                </div>
                <span className="font-bold text-gray-900">+300 empresas</span>
              </div>
              <p className="text-center text-gray-700 italic font-medium">
                "O melhor investimento que fizemos em 2025. Em menos de uma semana, o tempo economizado já pagou o investimento."
              </p>
              <p className="text-center text-blue-600 font-semibold mt-2 text-sm">
                ⭐⭐⭐⭐⭐ 4.9/5.0 - Baseado em 310 avaliações
              </p>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                Cadastre Gratuitamente Agora
              </button>
              <p className="text-sm text-gray-500 mt-4">
                ✓ Configuração em 30 segundos • ✓ Sem taxa de setup • ✓ Cancele quando quiser
              </p>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <button
                  onClick={onLogin}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Faça login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center gap-8">
        {/* Left Side - Benefits & Copy */}
        <div className="hidden lg:flex flex-col flex-1 space-y-8">
          <button
            onClick={() => setStep(1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">ERP Smart</h1>
                <p className="text-gray-600 text-sm">Inteligência para o seu negócio</p>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                Transforme seu négocio em decisões inteligentes
              </h2>
              <p className="text-lg text-gray-600">
                Junte-se a milhares de empresas que já automatizaram sua gestão e aumentaram a produtividade em até 300%
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">IA integrada</h3>
                  <p className="text-gray-600 text-sm">Insights automáticos e previsões precisas para seu negócio</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gestão completa</h3>
                  <p className="text-gray-600 text-sm">Vendas, finanças, estoque e clientes em um só lugar</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Relatórios profissionais</h3>
                  <p className="text-gray-600 text-sm">Exporte dados em PDF, Excel e compartilhe com sua equipe</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Comece grátis</h3>
                  <p className="text-gray-600 text-sm">Teste todas as funcionalidades sem compromisso</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 italic">
                "Desde que começamos a usar o ERP Smart, nossa receita aumentou 45% e economizamos 15 horas por semana em tarefas manuais."
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium">— Maria Silva, CEO TechStore</p>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full lg:w-[460px] flex-shrink-0">
          {/* Mobile Back Button */}
          <button
            onClick={() => setStep(1)}
            className="flex lg:hidden items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-center lg:hidden mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Crie sua conta grátis</h1>
              <p className="text-gray-600">Sem cartão de crédito. Pronto em 30 segundos.</p>
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
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Criando sua conta...
                </div>
              ) : (
                'Começar agora gratuitamente'
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>Sem cartão de crédito</span>
              <span>•</span>
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <button
                onClick={onLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Ao criar uma conta, você concorda com nossos</p>
          <div className="space-x-3 mt-1">
            <a href="#" className="hover:text-gray-700 transition-colors underline">Termos de Uso</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors underline">Política de Privacidade</a>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}