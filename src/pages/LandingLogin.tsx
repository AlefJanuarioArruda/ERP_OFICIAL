import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Brain, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LandingLogin: React.FC = () => {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email.trim()) {
      setError('Por favor, digite seu email');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Por favor, digite sua senha');
      setLoading(false);
      return;
    }

    const result = await signIn(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    } else {
      // Redirect to dashboard on success
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const isInvalidCredentialsError = error.includes('Email ou senha incorretos');

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
                onClick={() => navigate('/cadastro')}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Entrar na sua conta</h1>
              <p className="text-gray-600">Acesse seu painel de controle empresarial</p>
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
                      setFormData({ ...formData, email: e.target.value });
                      if (error) setError('');
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
                      setFormData({ ...formData, password: e.target.value });
                      if (error) setError('');
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
                  onClick={() => navigate('/esqueci-senha')}
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
                  onClick={() => navigate('/cadastro')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Cadastre-se grátis
                </button>
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Por que escolher o ERP Smart?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                Controle financeiro completo com IA
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Gestão inteligente de estoque
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Relatórios automáticos e insights
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                Suporte especializado 24/7
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-500">
        <p>Ao entrar, você concorda com nossos</p>
        <div className="space-x-4">
          <a href="#" className="hover:text-gray-700 transition-colors">Termos de Uso</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-700 transition-colors">Política de Privacidade</a>
        </div>
      </div>
    </div>
  );
};