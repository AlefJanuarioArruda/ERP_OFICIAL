import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Brain, User, AlertCircle, CheckCircle, Home, Zap, Star, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LandingSignUp: React.FC = () => {
  const { signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const result = await signUp(formData.name, formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao criar conta');
    } else {
      // Redirect to dashboard on success
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const isUserExistsError = error.includes('já está cadastrado');

  const benefits = [
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Configuração Rápida",
      description: "Sistema pronto em menos de 5 minutos"
    },
    {
      icon: <Star className="w-6 h-6 text-emerald-600" />,
      title: "IA Avançada",
      description: "Insights automáticos para seu negócio"
    },
    {
      icon: <Crown className="w-6 h-6 text-amber-600" />,
      title: "Suporte Premium",
      description: "Especialistas prontos para ajudar"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ERP Smart</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Já tenho conta
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Transforme Seu Negócio
                  <span className="block text-blue-600">em 5 Minutos</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Junte-se a mais de 2.500 empresários que já aumentaram seus lucros 
                  em até 47% com nossa plataforma inteligente.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="font-semibold text-gray-900 mb-3">✅ Garantias Incluídas:</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    14 dias de teste gratuito
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Sem cartão de crédito necessário
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Garantia de 30 dias
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                    Dados 100% seguros
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta Gratuita</h2>
                <p className="text-gray-600">Comece sua transformação empresarial hoje</p>
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
                            onClick={() => navigate('/login')}
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
                        setFormData({ ...formData, name: e.target.value });
                        if (validationErrors.name) {
                          setValidationErrors({ ...validationErrors, name: '' });
                        }
                        if (error) setError('');
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
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: '' });
                        }
                        if (error) setError('');
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
                        setFormData({ ...formData, password: e.target.value });
                        if (validationErrors.password) {
                          setValidationErrors({ ...validationErrors, password: '' });
                        }
                        if (error) setError('');
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
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (validationErrors.confirmPassword) {
                          setValidationErrors({ ...validationErrors, confirmPassword: '' });
                        }
                        if (error) setError('');
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
                    'Criar Conta Gratuita'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Já tem uma conta?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Faça login
                  </button>
                </p>
              </div>

              {/* Security Notice */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900 text-sm">Conta 100% Segura</span>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• Criptografia de nível bancário</p>
                  <p>• Seus dados nunca são compartilhados</p>
                  <p>• Conformidade com LGPD</p>
                  <p>• Backup automático diário</p>
                </div>
              </div>
            </div>

            {/* Right Side - Value Proposition */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Resultados Garantidos em 30 Dias
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  Nossa IA analisa seus dados e identifica oportunidades de lucro 
                  que você nem sabia que existiam.
                </p>
              </div>

              {/* Results Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-300 mb-1">+47%</div>
                  <div className="text-sm text-blue-100">Aumento médio de lucro</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-1">-35%</div>
                  <div className="text-sm text-blue-100">Redução de custos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-300 mb-1">2.500+</div>
                  <div className="text-sm text-blue-100">Empresas transformadas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-300 mb-1">R$ 50M+</div>
                  <div className="text-sm text-blue-100">Lucro gerado</div>
                </div>
              </div>

              {/* What You Get */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white mb-3">🚀 O que você terá acesso:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mr-2" />
                    <span className="text-blue-100">Dashboard financeiro em tempo real</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mr-2" />
                    <span className="text-blue-100">Controle inteligente de estoque</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mr-2" />
                    <span className="text-blue-100">IA que identifica oportunidades</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mr-2" />
                    <span className="text-blue-100">Relatórios automáticos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mr-2" />
                    <span className="text-blue-100">Suporte especializado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500 border-t border-gray-200">
        <p>Ao criar uma conta, você concorda com nossos</p>
        <div className="space-x-4">
          <a href="#" className="hover:text-gray-700 transition-colors">Termos de Uso</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 transition-colors">Política de Privacidade</a>
        </div>
      </div>
    </div>
  );
};