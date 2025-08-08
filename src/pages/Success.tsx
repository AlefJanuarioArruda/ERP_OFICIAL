import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Home, CreditCard, Calendar } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export const Success: React.FC = () => {
  const { refetch, getCurrentPlan, getActiveSubscription } = useStripe();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    setSessionId(sessionIdParam);

    // Refetch subscription data to get the latest info
    const fetchData = async () => {
      await refetch();
      setLoading(false);
    };

    // Add a small delay to ensure webhook has processed
    setTimeout(fetchData, 2000);
  }, [refetch]);

  const { product, isActive } = getActiveSubscription();
  const currentPlan = getCurrentPlan();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processando sua assinatura...</h2>
          <p className="text-gray-600">Aguarde enquanto confirmamos seu pagamento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Pagamento Realizado com Sucesso!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Bem-vindo ao ERP Smart! Sua assinatura foi ativada e você já pode começar a usar 
            todas as funcionalidades da plataforma.
          </p>

          {/* Subscription Details */}
          {isActive && product && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalhes da Sua Assinatura</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-center md:justify-start">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-gray-700">
                    <strong>Plano:</strong> {product.name}
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start">
                  <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-gray-700">
                    <strong>Renovação:</strong> {product.interval === 'year' ? 'Anual' : 'Mensal'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Session ID (for support) */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600">
                <strong>ID da Sessão:</strong> {sessionId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Guarde este número para referência em caso de dúvidas
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Passos</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Configure seu perfil</p>
                  <p className="text-sm text-gray-600">Adicione informações da sua empresa nas configurações</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cadastre seus produtos</p>
                  <p className="text-sm text-gray-600">Comece adicionando seus produtos e serviços</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Explore os insights de IA</p>
                  <p className="text-sm text-gray-600">Descubra como a IA pode otimizar seu negócio</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Ir para o Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            
            <button
              onClick={() => window.location.href = '/settings'}
              className="flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Configurar Perfil
            </button>
          </div>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Precisa de ajuda? Entre em contato conosco pelo email{' '}
            <a href="mailto:suporte@erpsmart.com" className="text-blue-600 hover:text-blue-700 font-medium">
              suporte@erpsmart.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};