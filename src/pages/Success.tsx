import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, CreditCard, Calendar, RefreshCw, Clock } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';
import { formatPrice } from '../stripe-config';

export const Success: React.FC = () => {
  const { refetch, getCurrentPlan, getActiveSubscription } = useStripe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
  const sessionIdParam = searchParams.get('session_id');
  setSessionId(sessionIdParam);

    // Se há session_id, significa que veio do Stripe
    // Fazer uma verificação inicial após 2 segundos
    if (sessionIdParam) {
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch]);

  const forceRefresh = async () => {
    setIsChecking(true);
    await refetch();
    setIsChecking(false);
  };

  const { product, isActive } = getActiveSubscription();
  const currentPlan = getCurrentPlan();

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
            {isActive ? '🎉 Pagamento Realizado com Sucesso!' : '✅ Pagamento Processado'}
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            {isActive 
              ? 'Bem-vindo ao ERP Smart! Sua assinatura foi ativada e você já pode começar a usar todas as funcionalidades da plataforma.'
              : 'Seu pagamento foi processado com sucesso. Aguarde alguns instantes para a ativação da assinatura.'
            }
          </p>

          {/* Subscription Status */}
          <div className={`rounded-xl p-6 mb-8 border ${
            isActive 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          }`}>
            <h2 className="text-xl font-semibold text-green-900 mb-4">Status da Assinatura</h2>
            
            <div className="flex items-center justify-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                isActive ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {isActive ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="text-left">
                <p className={`font-semibold ${isActive ? 'text-green-900' : 'text-amber-900'}`}>
                  {isActive ? 'Assinatura Ativa' : 'Processando Ativação...'}
                </p>
                <p className={`text-sm ${isActive ? 'text-green-700' : 'text-amber-700'}`}>
                  {isActive ? currentPlan : 'Aguardando confirmação do sistema'}
                </p>
              </div>
            </div>

            {!isActive && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center">
                    {isChecking ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    )}
                    <span className="text-blue-800 text-sm">
                      {isChecking ? 'Verificando status...' : 'Ativação em andamento...'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={forceRefresh}
                  disabled={isChecking}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 inline ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Verificando...' : 'Verificar Status Agora'}
                </button>
              </>
            )}
          </div>

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
                    <strong>Valor:</strong> {formatPrice(product.price)}
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start md:col-span-2">
                  <Calendar className="w-5 h-5 text-green-600 mr-2" />
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Ir para o Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Configurar Perfil
            </button>
          </div>

          {/* Manual Refresh Option */}
          {!isActive && sessionId && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                💡 <strong>Dica:</strong> A ativação geralmente é instantânea. Se não ativou ainda, 
                pode ser um atraso temporário no processamento.
              </p>
            </div>
          )}
        </div>

        {/* Support Info */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Precisa de ajuda? Entre em contato conosco pelo email{' '}
            <a href="mailto:suporte@erpsmart.com" className="text-blue-600 hover:text-blue-700 font-medium">
              suporte@erpsmart.com
            </a>
          </p>
          {sessionId && (
            <p className="text-sm text-gray-500 mt-2">
              Mencione o ID da sessão: {sessionId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};