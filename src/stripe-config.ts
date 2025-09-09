export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

// Configuração dos produtos Stripe
export const stripeProducts: StripeProduct[] = [
  {
    id: 'plano-mensal',
    priceId: 'price_mensal', // Será usado como identificador interno
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    price: 2990, // R$ 29.90 em centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Produtos ilimitados',
      'Clientes ilimitados', 
      'Vendas ilimitadas',
      'Controle financeiro completo',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'plano-semestral',
    priceId: 'price_semestral', // Será usado como identificador interno
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    price: 14990, // R$ 149.90 em centavos
    currency: 'brl',
    interval: 'month', // Configurado como 6 meses no Stripe
    popular: true,
    features: [
      'Tudo do plano mensal',
      'Relatórios avançados',
      'IA Insights completos',
      'Suporte prioritário',
      'Backup automático',
      'Exportação de dados'
    ]
  },
  {
    id: 'plano-anual',
    priceId: 'price_anual', // Será usado como identificador interno
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com máximo desconto',
    price: 25990, // R$ 259.90 em centavos
    currency: 'brl',
    interval: 'year',
    features: [
      'Tudo dos planos anteriores',
      'Consultoria estratégica',
      'Integrações personalizadas',
      'Suporte telefônico',
      'Treinamento exclusivo',
      'Relatórios personalizados'
    ]
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const formatPrice = (price: number, currency: string = 'brl'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};

// URLs de checkout direto do Stripe (você precisa configurar no seu Dashboard)
export const getStripeCheckoutUrl = (productId: string): string => {
  // IMPORTANTE: Substitua estas URLs pelas URLs reais do seu Stripe Dashboard
  // Vá em: Stripe Dashboard > Payment Links > Criar novo link de pagamento
  
  const checkoutUrls: Record<string, string> = {
    'plano-mensal': 'https://buy.stripe.com/test_SUBSTITUA_PELA_URL_MENSAL',
    'plano-semestral': 'https://buy.stripe.com/test_SUBSTITUA_PELA_URL_SEMESTRAL', 
    'plano-anual': 'https://buy.stripe.com/test_SUBSTITUA_PELA_URL_ANUAL'
  };
  
  return checkoutUrls[productId] || '#';
};

// Função para criar checkout usando a API do Stripe (fallback)
export const createCheckoutSession = async (priceId: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/?page=pricing`,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar sessão de checkout');
    }

    return data;
  } catch (error) {
    console.error('Erro no checkout:', error);
    throw error;
  }
};