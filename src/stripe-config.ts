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
    id: 'plano-mensal',
    priceId: 'price_1S5CgDRyTupwgwOO1LH6xXol', // Production Price ID - Plano Mensal R$ 29,90
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
    id: 'plano-semestral',
    priceId: 'price_1S5CgcRyTupwgwOOZJa8yy4A', // Production Price ID - Plano Semestral R$ 149,90
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
    id: 'plano-anual',
    priceId: 'price_1S5CgwRyTupwgwOOuSFgfryG', // Production Price ID - Plano Anual R$ 259,90
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

// Função para detectar se estamos em ambiente de teste ou produção
export const detectStripeEnvironment = (priceId: string): 'test' | 'live' | 'unknown' => {
  if (priceId.startsWith('price_test_')) {
    return 'test';
  } else if (priceId.startsWith('price_')) {
    return 'live';
  }
  return 'unknown';
};

// Função para validar se todos os price IDs são do mesmo ambiente
export const validateStripeEnvironment = (): { isValid: boolean; environment: string; message?: string } => {
  const environments = stripeProducts.map(product => detectStripeEnvironment(product.priceId));
  const uniqueEnvironments = [...new Set(environments)];
  
  if (uniqueEnvironments.length > 1) {
    return {
      isValid: false,
      environment: 'mixed',
      message: 'Price IDs de ambientes diferentes detectados (Test e Live). Verifique a configuração.'
    };
  }
  
  const environment = uniqueEnvironments[0];
  
  if (environment === 'unknown') {
    return {
      isValid: false,
      environment: 'unknown',
      message: 'Price IDs com formato inválido detectados. Verifique se são Price IDs válidos do Stripe.'
    };
  }
  
  return {
    isValid: true,
    environment: environment === 'test' ? 'Teste' : 'Produção'
  };
};

// Função para criar checkout usando a API do Stripe
export const createCheckoutSession = async (priceId: string, accessToken?: string) => {
  try {
    // Validar ambiente antes de criar checkout
    const validation = validateStripeEnvironment();
    if (!validation.isValid) {
      throw new Error(validation.message || 'Erro de configuração do Stripe');
    }

    const authHeader = accessToken 
      ? `Bearer ${accessToken}`
      : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
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
      // Tratar erro específico de Price ID não encontrado
      if (data.error && data.error.includes('No such price')) {
        const environment = detectStripeEnvironment(priceId);
        const environmentText = environment === 'test' ? 'Test' : environment === 'live' ? 'Live' : 'desconhecido';
        
        throw new Error(
          `Price ID não encontrado no Stripe.\n\n` +
          `Verifique se o Price ID '${priceId}' pertence ao mesmo ambiente da sua API Key (${environmentText}).\n\n` +
          `Dica: Price IDs de teste começam com 'price_test_' e de produção com 'price_'.`
        );
      }
      
      throw new Error(data.error || 'Erro ao criar sessão de checkout');
    }

    return data;
  } catch (error) {
    console.error('Erro no checkout:', error);
    throw error;
  }
};