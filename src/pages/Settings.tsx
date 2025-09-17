ns.push}
                        onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Alertas de Estoque Baixo</h4>
                      <p className="text-sm text-gray-600">Seja notificado quando produtos estiverem com estoque baixo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.lowStock}
                        onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Relatórios de Vendas</h4>
                      <p className="text-sm text-gray-600">Receba resumos semanais de vendas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.sales}
                        onChange={(e) => setNotifications({...notifications, sales: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Alertas Financeiros</h4>
                      <p className="text-sm text-gray-600">Notificações sobre vencimentos e pagamentos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.financial}
                        onChange={(e) => setNotifications({...notifications, financial: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Relatórios Automáticos</h4>
                      <p className="text-sm text-gray-600">Receba relatórios mensais automaticamente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.reports}
                        onChange={(e) => setNotifications({...notifications, reports: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Plano e Faturamento</h3>
                
                <BillingSection />
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Integrações</h3>
                
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Integrações em Breve</h4>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Estamos trabalhando para trazer integrações incríveis que vão conectar seu ERP Smart 
                    com as principais ferramentas do mercado.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                    <h5 className="font-semibold text-gray-900 mb-3">🚀 Próximas Integrações:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Mercado Livre & OLX
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        WhatsApp Business
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Correios & Transportadoras
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        Bancos & PIX
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Nota Fiscal Eletrônica
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                        Google Analytics
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Quer sugerir uma integração? Entre em contato conosco!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Billing Section Component
const BillingSection: React.FC = () => {
  const { subscription, getActiveSubscription, loading, createCheckoutSession } = useStripe();
  const { product, isActive } = getActiveSubscription();
  const [loadingManageSubscription, setLoadingManageSubscription] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Carregando informações de faturamento...</span>
      </div>
    );
  }

  if (!isActive || !product) {
    return (
      <div className="text-center py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Plano Ativo</h4>
          <p className="text-gray-600 mb-4">
            Você não possui um plano ativo no momento. Escolha um plano para começar a usar todas as funcionalidades.
          </p>
          <button
            onClick={() => {
              navigate('/pricing')
              // Navigate to pricing page using the parent component's navigation
              const event = new CustomEvent('navigate-to-pricing');
              window.dispatchEvent(event);
            }}
            
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Planos Disponíveis
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'trialing':
        return 'Período de Teste';
      case 'past_due':
        return 'Pagamento Atrasado';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleManageSubscription = async () => {
    if (!product) return;
    
    setLoadingManageSubscription(true);
    
    try {
      const result = await createCheckoutSession(product.priceId, 'subscription');
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || 'Erro ao abrir gerenciamento de assinatura');
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingManageSubscription(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatPrice(product.price)} / {product.interval === 'year' ? 'ano' : 'mês'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription?.subscription_status || '')}`}>
            {getStatusLabel(subscription?.subscription_status || '')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscription?.current_period_end && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Próxima Renovação</h4>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-gray-600">{formatDate(subscription.current_period_end)}</p>
            {subscription.cancel_at_period_end && (
              <p className="text-sm text-red-600 mt-1">Cancelamento agendado</p>
            )}
          </div>
        )}
        
        {subscription?.payment_method_brand && subscription?.payment_method_last4 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Método de Pagamento</h4>
            <p className="text-gray-900">•••• •••• •••• {subscription.payment_method_last4}</p>
            <p className="text-sm text-gray-600 capitalize">{subscription.payment_method_brand}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            navigate('/pricing');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Alterar Plano
        </button>
        <button 
          onClick={handleManageSubscription}
          disabled={loadingManageSubscription || !product}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingManageSubscription ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Carregando...
            </div>
          ) : (
            'Gerenciar Assinatura'
          )}
        </button>
      </div>
    </>
  );
};