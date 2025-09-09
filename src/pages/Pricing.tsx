import React, { useState } from 'react';
import { Check, Zap, Crown, Star, ArrowRight, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { stripeProducts, formatPrice, createCheckoutSession, validateStripeEnvironment } from '../stripe-config';
import { useStripe } from '../hooks/useStripe';
import { supabase } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export const Pricing: React.FC = () => {
  const { getCurrentPlan, isSubscriptionActive, getSubscriptionStatus } = useStripe();
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const currentPlan = getCurrentPlan();
  const subscriptionStatus = getSubscriptionStatus();

  // Validar configuração do Stripe na inicialização
  const stripeValidation = validateStripeEnvironment();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubscribe = async (productId: string, productName: string) => {
    setRedirectingTo(productName);
    
    try {
      console.log('Iniciando processo de assinatura para produto:', productName);
      
      // Obter o token de acesso do usuário autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Erro de autenticação. Faça login novamente.');
      }
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login para continuar.');
      }

      // Verificar e limpar customer_id inválido antes de tentar checkout
      if (session.user) {
        console.log('Verificando customer_id existente para usuário:', session.user.id);
        
        const { data: existingCustomer } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', session.user.id)
          .eq('deleted_at', null)
          .maybeSingle();

        if (existingCustomer?.customer_id) {
          console.log('Customer_id encontrado no banco:', existingCustomer.customer_id);
          
          // Verificar se o customer ainda existe no Stripe
          try {
            const stripeResponse = await fetch(`https://api.stripe.com/v1/customers/${existingCustomer.customer_id}`, {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}`,
              },
            });
            
            if (!stripeResponse.ok) {
              console.log('Customer inválido detectado, marcando como deletado:', existingCustomer.customer_id);
              
              // Marcar como deletado para forçar criação de novo
              await supabase
                .from('stripe_customers')
                .update({ deleted_at: new Date().toISOString() })
                .eq('user_id', session.user.id);
                
              showNotification('success', 'Dados de pagamento atualizados. Tentando novamente...');
            } else {
              console.log('Customer válido no Stripe');
            }
          } catch (error) {
            console.log('Erro ao verificar customer, será criado um novo:', error);
            
            // Marcar como deletado para forçar criação de novo
            await supabase
              .from('stripe_customers')
              .update({ deleted_at: new Date().toISOString() })
              .eq('user_id', session.user.id);
          }
        }
      }

      // Encontrar o produto pelo ID
      const product = stripeProducts.find(p => p.id === productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }
      
      console.log('Creating checkout for product:', product.name, 'Price ID:', product.priceId);
      
      // Criar sessão de checkout
      const { url } = await createCheckoutSession(product.priceId, session.access_token);
      
      if (url) {
        console.log('Redirecting to checkout URL:', url);
        // Redirecionar para o Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
      
    } catch (error) {
      console.error('Erro ao redirecionar para checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      
      // Mensagens de erro mais amigáveis
      if (errorMessage.includes('No such customer')) {
        showNotification('error', 'Dados de pagamento inconsistentes. Tentando corrigir automaticamente...');
        
        // Tentar novamente após 2 segundos
        setTimeout(() => {
          handleSubscribe(productId, productName);
        }, 2000);
        return;
      } else {
        showNotification('error', errorMessage);
      }
      
      setRedirectingTo(null);
    }
  };

  const getPopularBadge = (product: any) => {
    if (product.popular) {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Mais Popular
          </span>
        </div>
      );
    }
    return null;
  };

  const getCardIcon = (productName: string) => {
    switch (productName) {
      case 'Plano Mensal':
        return <Zap className="w-8 h-8 text-blue-600" />;
      case 'Plano Semestral':
        return <Star className="w-8 h-8 text-green-600" />;
      case 'Plano Anual':
        return <Crown className="w-8 h-8 text-amber-600" />;
      default:
        return <Zap className="w-8 h-8 text-blue-600" />;
    }
  };

  const getCardStyle = (product: any) => {
    if (product.popular) {
      return 'border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl scale-105';
    }
    return 'border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow';
  };

  const getIntervalLabel = (product: any) => {
    if (product.name === 'Plano Semestral') {
      return '6 meses';
    }
    return product.interval === 'year' ? 'ano' : 'mês';
  };

  const getSavingsText = (product: any) => {
    if (product.interval === 'year') {
      const monthlyEquivalent = product.price / 12;
      const monthlySavings = 2990 - monthlyEquivalent;
      const yearlySavings = monthlySavings * 12;
      return `Economize R$ ${(yearlySavings / 100).toFixed(0)} no ano!`;
    }
    if (product.name === 'Plano Semestral') {
      return 'Mais popular entre nossos clientes!';
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium whitespace-pre-line">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Escolha o Plano Ideal para Seu Negócio
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transforme sua gestão empresarial com o poder da Inteligência Artificial. 
          Todos os planos incluem acesso completo às funcionalidades.
        </p>
        {currentPlan !== 'Nenhum plano ativo' && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <Check className="w-4 h-4 mr-2" />
            Plano atual: {currentPlan}
            {subscriptionStatus.expiresAt && (
              <span className="ml-2 text-sm">
                • Renova em {subscriptionStatus.expiresAt.toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        )}
        
        {subscriptionStatus.needsPayment && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pagamento pendente - Renove sua assinatura
          </div>
        )}
      </div>

      {/* Stripe Environment Validation */}
      {!stripeValidation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Erro de Configuração do Stripe</h3>
              <p className="text-sm text-red-800">{stripeValidation.message}</p>
              <p className="text-xs text-red-700 mt-2">
                Verifique se todos os Price IDs pertencem ao mesmo ambiente (Test ou Live) da sua API Key.
              </p>
            </div>
          </div>
        </div>
      )}

      {stripeValidation.isValid && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Stripe Configurado</h3>
              <p className="text-sm text-blue-800">
                Ambiente: <strong>{stripeValidation.environment}</strong> • Pagamentos processados de forma segura
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {stripeProducts.map((product) => (
          <div key={product.id} className={`relative rounded-2xl p-8 ${getCardStyle(product)}`}>
            {getPopularBadge(product)}
            
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {getCardIcon(product.name)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                <span className="text-gray-600 ml-2">
                  /{getIntervalLabel(product)}
                </span>
                {getSavingsText(product) && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {getSavingsText(product)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(product.id, product.name)}
              disabled={redirectingTo === product.name || !stripeValidation.isValid}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                product.popular
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {redirectingTo === product.name ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Redirecionando para pagamento...
                </>
              ) : !stripeValidation.isValid ? (
                'Configuração Pendente'
              ) : (
                <>
                  {subscriptionStatus.isActive ? 'Alterar Plano' : 'Assinar Agora'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🚀 Com qualquer plano você terá:
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Registros ilimitados em todas as seções</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Acesso completo aos relatórios</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">IA Insights avançados</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Exportação de dados para Excel</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Suporte prioritário</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Backup automático dos dados</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Atualizações automáticas</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Cancelamento a qualquer momento</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Security Section */}
      <div className="bg-green-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
          🔒 Pagamento 100% Seguro
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-4">Processamento Seguro</h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Processado pelo Stripe (certificação PCI DSS)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Criptografia SSL 256-bit</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Proteção contra fraude</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Dados nunca armazenados em nossos servidores</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-4">Formas de Pagamento</h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Cartão de crédito (Visa, Mastercard, Elo)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Cartão de débito</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>PIX (disponível em breve)</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                <span>Cancelamento a qualquer momento</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Posso cancelar minha assinatura a qualquer momento?
            </h3>
            <p className="text-gray-600">
              Sim, você pode cancelar sua assinatura a qualquer momento. Você continuará tendo acesso 
              até o final do período pago.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Como funciona o pagamento?
            </h3>
            <p className="text-gray-600">
              O pagamento é processado de forma segura pelo Stripe. Você será redirecionado para 
              a página oficial de pagamento onde pode usar cartão de crédito, débito ou PIX.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Meus dados ficam seguros?
            </h3>
            <p className="text-gray-600">
              Sim, utilizamos criptografia de ponta e backup automático. Seus dados são protegidos 
              com os mais altos padrões de segurança.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Qual a diferença entre os planos?
            </h3>
            <p className="text-gray-600">
              Todos os planos incluem acesso completo às funcionalidades. A diferença está no 
              período de cobrança e no valor total - planos mais longos oferecem maior economia.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              O que acontece se eu tiver problemas com Price IDs?
            </h3>
            <p className="text-gray-600">
              Se você receber erro "No such price", verifique se o Price ID pertence ao mesmo ambiente 
              da sua API Key (Test ou Live). Price IDs de teste começam com "price_test_" e de produção com "price_".
            </p>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Pagamento 100% Seguro</h3>
        <p className="text-blue-100 mb-6">
          Processado pelo Stripe, a mesma tecnologia usada por empresas como Shopify, Lyft e Deliveroo
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            Criptografia SSL 256-bit
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            Certificação PCI DSS
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            Proteção contra fraude
          </div>
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            Dados nunca armazenados
          </div>
        </div>
      </div>
    </div>
  );
};