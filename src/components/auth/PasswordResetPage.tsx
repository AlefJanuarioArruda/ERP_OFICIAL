import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Brain, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface PasswordResetPageProps {
  onBack: () => void;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onBack }) => {
  const { updatePassword } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const validateRecoveryToken = async () => {
      try {
        const hash = window.location.hash;
        
        if (!hash) {
          setError('Link de recuperação inválido. Não foi possível encontrar os parâmetros.');
          setCheckingToken(false);
          return;
        }

        // Parse the hash to extract recovery parameters
        let accessToken = '';
        let refreshToken = '';
        let type = '';

        // Handle different hash formats
        if (hash.includes('#/reset-password')) {
          // Format: #/reset-password#access_token=...&expires_at=...&refresh_token=...&token_type=bearer&type=recovery
          const recoveryPart = hash.split('#/reset-password')[1];
          if (recoveryPart && recoveryPart.startsWith('#')) {
            const params = new URLSearchParams(recoveryPart.substring(1));
            accessToken = params.get('access_token') || '';
            refreshToken = params.get('refresh_token') || '';
            type = params.get('type') || '';
          }
        } else if (hash.includes('type=recovery')) {
          // Direct hash format: #access_token=...&type=recovery...
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token') || '';
          refreshToken = params.get('refresh_token') || '';
          type = params.get('type') || '';
        }

        if (!accessToken || !refreshToken || type !== 'recovery') {
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
          setCheckingToken(false);
          return;
        }

        // Set the session with the recovery tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Erro ao validar token de recuperação:', error);
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
          setCheckingToken(false);
          return;
        }

        if (data.session) {
          setIsValidToken(true);
        } else {
          setError('Sessão de recuperação inválida. Solicite um novo link.');
        }

      } catch (err: any) {
        console.error('Erro inesperado ao validar token:', err);
        setError('Erro inesperado. Tente solicitar um novo link de recuperação.');
      } finally {
        setCheckingToken(false);
      }
    };

    validateRecoveryToken();
  }, []);

  const validateForm = () => {
    if (!formData.password) {
      setError('Nova senha é obrigatória');
      return false;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await updatePassword(formData.password);

      if (result.success) {
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          // Clear the hash and redirect to login
          window.location.hash = '';
          window.location.reload();
        }, 3000);
      } else {
        setError(result.error || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking token
  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Validando Link de Recuperação</h1>
            <p className="text-gray-600">Aguarde enquanto verificamos seu link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Inválido ou Expirado</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <p className="text-gray-600 mb-8">
              O link de recuperação de senha não é válido ou já expirou. 
              Solicite um novo link para continuar.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Solicitar Novo Link
              </button>
              
              <button
                onClick={onBack}
                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Voltar ao Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Senha Atualizada com Sucesso!</h1>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">✅ Sua senha foi redefinida com sucesso!</p>
              <p className="text-green-700 text-sm mt-1">
                Você será redirecionado para o login em alguns segundos...
              </p>
            </div>
            
            <p className="text-gray-600 mb-6">
              Agora você pode fazer login com sua nova senha.
            </p>
            
            <button
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Smart</h1>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
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
                    setFormData({ ...formData, password: e.target.value });
                    if (error) setError('');
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
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (error) setError('');
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
              {formData.confirmPassword && (
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
              disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Atualizando Senha...
                </div>
              ) : (
                'Atualizar Senha'
              )}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Lock className="w-4 h-4 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Segurança</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Use uma senha forte e única</p>
              <p>• Mínimo de 6 caracteres</p>
              <p>• Combine letras, números e símbolos</p>
              <p>• Não compartilhe sua senha</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Lembrou da sua senha?{' '}
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Voltar ao login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};