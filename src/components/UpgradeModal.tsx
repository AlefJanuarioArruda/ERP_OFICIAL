import React from 'react';
import { Crown, X, Check, Zap, Star, ExternalLink } from 'lucide-react';
import { stripeProducts, formatPrice, createStripeCheckoutUrl } from '../stripe-config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Limite de Uso Atingido",
  message = "Você atingiu o limite de uso gratuito. Assine para continuar usando sem restrições."
}) => {
  const [redirectingTo, setRedirectingTo] = React.useState<string | null>(null);

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
      const cancelUrl = encodeURIComponent(`${window.location.origin}/`);
      
      const finalUrl = `${checkoutUrl}?success_url=${successUrl}&cancel_url=${cancelUrl}`;
      
      // Redirecionar para o Stripe Checkout
      window.location.href = finalUrl;
      
    } catch (error) {
      console.error('Erro ao redirecionar para checkout:', error);
      alert('Erro inesperado. Tente novamente.');
      setRedirectingTo(null);
    }
  };

  const getCardIcon = (productName: string) => {
    switch (productName) {
      case 'Plano Mensal':
        return <Zap className="w-6 h-6 text-blue-600" />;
      case 'Plano Semestral':
        return <Star className="w-6 h-6 text-green-600" />;
      case 'Plano Anual':
        return <Crown className="w-6 h-6 text-amber-600" />;
      default:
        return <Zap className="w-6 h-6 text-blue-600" />;
    }
  };

  const getCardStyle = (product: any) => {
    if (product.popular) {
      return 'border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 transform scale-105';
    }
    return 'border border-gray-200 bg-white';
  };

  const getPopularBadge = (product: any) => {
    if (product.popular) {
      return (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Mais Popular
          </span>
        </div>
      );
    }
    return null;
  };

  const getIntervalLabel = (product: any) => {
    if (product.name === 'Plano Semestral') {
      return '6 meses';
    }
    return product.interval === 'year' ? 'ano' : 'mês';
  };

  const getSavingsText = (product: any) => {
    if (product.interval === 'year') {
      return 'Economize mais de R$ 100 no ano!';
    }
    if (product.name === 'Plano Semestral') {
      return 'Mais popular entre nossos clientes!';
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600">{message}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stripeProducts.map((product) => (
              <div key={product.id} className={`relative rounded-xl p-6 ${getCardStyle(product)}`}>
                {getPopularBadge(product)}
                
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    {getCardIcon(product.name)}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-gray-600 ml-1">
                      /{getIntervalLabel(product)}
                    </span>
                    {getSavingsText(product) && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {getSavingsText(product)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {product.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(product.priceId, product.name)}
                  disabled={redirectingTo === product.name}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                    product.popular
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {redirectingTo === product.name ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      Assinar Agora
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">🚀 Com a assinatura você terá:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                Registros ilimitados em todas as seções
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                Acesso completo aos relatórios
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                IA Insights avançados
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                Exportação de dados para Excel
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                Suporte prioritário
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-blue-600 mr-2" />
                Backup automático dos dados
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800">
              <Check className="w-5 h-5 mr-2" />
              <span className="font-medium">Pagamento 100% seguro processado pelo Stripe</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Seus dados de pagamento são protegidos com criptografia de nível bancário
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};