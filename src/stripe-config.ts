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
  mode: 'subscription';
}

// Configuração dos produtos Stripe
export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_T1FAK1uqgZkta9',
    priceId: 'price_1S5CgDRyTupwgwOO1LH6xXol',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    price: 2990, // R$ 29.90 em centavos
    currency: 'brl',
    interval: 'month',
    mode: 'subscription',
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
    id: 'prod_T1FAZ6vxP70anf',
    priceId: 'price_1S5CgcRyTupwgwOOZJa8yy4A',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    price: 14990, // R$ 149.90 em centavos
    currency: 'brl',
    interval: 'month', // Configurado como 6 meses no Stripe
    mode: 'subscription',
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
    id: 'prod_T1FBZMsJ1G5oRQ',
    priceId: 'price_1S5CgwRyTupwgwOOuSFgfryG',
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com máximo desconto',
    price: 25990, // R$ 259.90 em centavos
    currency: 'brl',
    interval: 'year',
    mode: 'subscription',
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

// Função para criar checkout usando a API do Stripe
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
        mode: 'subscription',
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