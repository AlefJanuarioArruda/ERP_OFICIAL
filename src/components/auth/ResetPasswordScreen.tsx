import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  onBack: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack }) => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
  // Tentar extrair parâmetros do fragmento (#)
  let hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  let accessToken = hashParams.get('access_token');
  let refreshToken = hashParams.get('refresh_token');
  let type = hashParams.get('type');

  // Se não encontrar no fragmento, tentar na query string
  if (!accessToken || !refreshToken || !type) {
    const queryParams = new URLSearchParams(window.location.search);
    accessToken = queryParams.get('access_token');
    refreshToken = queryParams.get('refresh_token');
    type = queryParams.get('type');
  }

  console.log('Parâmetros extraídos:', { accessToken, refreshToken, type });

  // Verifica se o link de recuperação é válido
  if (type !== 'recovery' || !accessToken || !refreshToken) {
    setError('Link de recuperação inválido ou incompleto. Verifique o link recebido no e-mail.');
    return;
  }

  // Configura a sessão com o token de recuperação
  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  }).then(({ data, error }) => {
    console.log('Sessão configurada:', data);
    if (error) {
      setError(`Erro ao configurar sessão: ${error.message}`);
      return;
    }
    if (data.session?.user?.email) {
      setUserEmail(data.session.user.email);
    } else {
      setError('Não foi possível obter informações do usuário. O token pode estar inválido.');
    }
  }).catch((err) => {
    console.error('Erro inesperado ao configurar sessão:', err);
    setError('Erro inesperado ao processar o link de recuperação.');
  });
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(`Erro ao redefinir senha: ${updateError.message}`);
        return;
      }

      setSuccess(true);

      if (userEmail) {
        setLoggingIn(true);
        const loginResult = await signIn(userEmail, formData.password);
        setLoggingIn(false);
        if (!loginResult.success) {
          setError('Erro ao realizar login automático. Redirecionando...');
          setTimeout(() => onBack(), 2000);
        }
      } else {
        setTimeout(() => onBack(), 3000);
      }
    } catch (err) {
      setError(`Erro inesperado ao redefinir senha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-4">🎉 Senha Redefinida!</h1>
          {loggingIn ? (
            <p>Entrando automaticamente...</p>
          ) : (
            <p>{userEmail ? 'Você será logado automaticamente.' : 'Redirecionando para login...'}</p>
          )}
          {!loggingIn && (
            <button
              onClick={onBack}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
            >
              Ir para Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Redefinir Senha</h1>
          <p className="text-gray-600">Digite sua nova senha</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 inline mr-2" />
            <span className="text-red-600 text-sm">{error}</span>
            {error.includes('inválido') && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/forgot-password'}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Solicitar novo link de recuperação
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nova Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-3 pr-12 py-3 border rounded-lg"
                placeholder="Digite sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Senha *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-3 pr-12 py-3 border rounded-lg"
                placeholder="Confirme sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redefinindo...' : 'Confirmar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};