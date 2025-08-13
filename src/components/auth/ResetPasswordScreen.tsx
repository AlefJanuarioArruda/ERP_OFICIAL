import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  onBack: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se a URL contém o hash
    const hash = window.location.hash;
    if (hash) {
      // Modifica o hash para o formato de parâmetros de URL
      const params = new URLSearchParams(hash.replace('#', '?'));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        // Se os tokens estiverem presentes, define o recoveryToken
        setRecoveryToken(access_token);
      } else {
        setError('Link de recuperação inválido. Verifique a URL.');
      }
    } else {
      setError('Link de recuperação inválido. Não foi possível encontrar o token.');
    }
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
      if (!recoveryToken) {
        setError('Link de recuperação inválido.');
        setLoading(false);
        return;
      }

      // Atualiza a senha sem fazer login automático
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) {
        setError(`Erro ao redefinir senha: ${updateError.message}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redireciona para a tela de login após sucesso
      setTimeout(() => {
        window.location.href = '/login'; // Redireciona para a tela de login
      }, 2000);

    } catch (err: any) {
      setError(`Erro inesperado: ${err.message}`);
      setLoading(false);
    }
  };

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

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-green-600">Senha Redefinida com Sucesso!</h2>
            <p className="mt-4 text-gray-600">Você será redirecionado para a tela de login em breve.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
            >
              Ir para Login
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
