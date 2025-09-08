import React, { useState } from 'react';
import { Check, Zap, Crown, Star, ArrowRight, ExternalLink } from 'lucide-react';
import { stripeProducts, formatPrice, createStripeCheckoutUrl } from '../stripe-config';
import { useStripe } from '../hooks/useStripe';

export const Pricing: React.FC = () => {
  const { getCurrentPlan, isSubscriptionActive } = useStripe();
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);
  const currentPlan = getCurrentPlan();

  const handleSubscribe = async (priceId: string, productName: string) => {
    setRedirectingTo(productName);
    
    try {
      // Criar URL de checkout direto do Stripe
      const checkoutUrl = createStripeCheckoutUrl(priceId);
      
      if (checkoutUrl === '#') {
        alert('Erro: URL de checkout não configurada para este produto');
        setRedirectingTo(null);
        return;
      }
      
      // Adicionar parâmetros de sucesso e cancelamento
      const successUrl = encodeURIComponent(`${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`);
      const cancelUrl = encodeURIComponent(`${window.location.origin}/?page=pricing`);
      
      const finalUrl = `${checkoutUrl}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
      
      // Redirecionar para o Stripe Checkout
      window.location.href = finalUrl;
      
    } catch (error) {
      console.error('Erro ao redirecionar para checkout:', error);
      alert('Erro inesperado. Tente novamente.');
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
          </div>
        )}
      </div>

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
              onClick={() => handleSubscribe(product.priceId, product.name)}
              disabled={redirectingTo === product.name}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                product.popular
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {redirectingTo === product.name ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Redirecionando...
                </>
              ) : (
                <>
                  Assinar Agora
                  <ExternalLink className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 rounded-2xl p-8 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Por que escolher o ERP Smart?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nossa plataforma combina gestão empresarial tradicional com o poder da Inteligência Artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">IA Avançada</h3>
            <p className="text-gray-600">
              Insights automáticos, previsões de vendas e recomendações estratégicas baseadas em seus dados
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestão Completa</h3>
            <p className="text-gray-600">
              Controle total de produtos, clientes, vendas, finanças e relatórios em uma única plataforma
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Suporte Premium</h3>
            <p className="text-gray-600">
              Suporte especializado, atualizações constantes e garantia de satisfação
            </p>
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