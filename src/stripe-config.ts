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
    priceId: 'price_1QdVGJRyTupwgwOOmKqHZvQs', // Substitua pelo seu Price ID real do Stripe
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    price: 2990, // R$ 29.90 em centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Produtos ilimitados',
      'Clientes ilimitados', 
      'Vendas ilimitadas',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'plano-semestral',
    priceId: 'price_1QdVGsRyTupwgwOOYhKqLmNp', // Substitua pelo seu Price ID real do Stripe
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    price: 14990, // R$ 149.90 em centavos (cobrado a cada 6 meses)
    currency: 'brl',
    interval: 'month', // Stripe interval, mas será configurado para 6 meses
    popular: true,
    features: [
      'Tudo do plano mensal',
      'Relatórios avançados',
      'IA Insights completos',
      'Suporte prioritário',
      'Backup automático'
    ]
  },
  {
    id: 'plano-anual',
    priceId: 'price_1QdVHHRyTupwgwOOzKqMnOpQ', // Substitua pelo seu Price ID real do Stripe
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
      'Treinamento exclusivo'
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

// Função para criar URL de checkout direto do Stripe
export const createStripeCheckoutUrl = (priceId: string): string => {
  const baseUrl = 'https://buy.stripe.com/test_'; // Para produção, remova 'test_'
  
  // Mapeamento dos Price IDs para URLs de checkout do Stripe
  const checkoutUrls: Record<string, string> = {
    'price_1QdVGJRyTupwgwOOmKqHZvQs': 'eVa5lq7Tn2Qg3Wm000', // Plano Mensal
    'price_1QdVGsRyTupwgwOOYhKqLmNp': 'bIY01C5Lj6Ys7Aq001', // Plano Semestral  
    'price_1QdVHHRyTupwgwOOzKqMnOpQ': 'cN203E7Pl8Zu9Cs002'  // Plano Anual
  };
  
  const checkoutId = checkoutUrls[priceId];
  
  if (!checkoutId) {
    console.error('Checkout URL não encontrada para o Price ID:', priceId);
    return '#';
  }
  
  return `${baseUrl}${checkoutId}`;
};