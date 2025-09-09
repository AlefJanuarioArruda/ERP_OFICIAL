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

// Configuração dos produtos Stripe para produção
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
      'Suporte por email',
      'IA Insights básicos',
      'Backup automático'
    ]
  },
  {
    id: 'prod_T1FAZ6vxP70anf',
    priceId: 'price_1S5CgcRyTupwgwOOZJa8yy4A',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    price: 14990, // R$ 149.90 em centavos (cobrado a cada 6 meses)
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
      'Exportação de dados',
      'Análises preditivas',
      'Consultoria básica'
    ]
  },
  {
    id: 'prod_T1FBZMsJ1G5oRQ',
    priceId: 'price_1S5CgwRyTupwgwOOuSFgfryG',
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com máximo desconto',
    price: 25990, // R$ 259.90 em centavos (cobrado anualmente)
    currency: 'brl',
    interval: 'year',
    mode: 'subscription',
    features: [
      'Tudo dos planos anteriores',
      'Consultoria estratégica',
      'Integrações personalizadas',
      'Suporte telefônico',
      'Treinamento exclusivo',
      'Relatórios personalizados',
      'API de integração',
      'Suporte dedicado'
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

// Função para detectar ambiente Stripe
export const detectStripeEnvironment = (): 'test' | 'live' => {
  const apiKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  return apiKey.includes('_test_') ? 'test' : 'live';
};

// Função para validar configuração do Stripe
export const validateStripeEnvironment = (): { isValid: boolean; environment: string; message?: string } => {
  const environment = detectStripeEnvironment();
  
  // Verificar se todos os price IDs são do mesmo ambiente
  const expectedPrefix = environment === 'test' ? 'price_test_' : 'price_';
  const invalidPrices = stripeProducts.filter(product => 
    !product.priceId.startsWith(expectedPrefix)
  );
  
  if (invalidPrices.length > 0) {
    return {
      isValid: false,
      environment: environment === 'test' ? 'Teste' : 'Produção',
      message: `Price IDs incompatíveis com ambiente ${environment}. Verifique: ${invalidPrices.map(p => p.priceId).join(', ')}`
    };
  }
  
  return {
    isValid: true,
    environment: environment === 'test' ? 'Teste' : 'Produção'
  };
};

// Função para criar checkout session
export const createCheckoutSession = async (priceId: string, accessToken?: string) => {
  try {
    // Primeiro, validar se o usuário tem um customer_id válido no Stripe
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }

    // Verificar se existe um customer_id no banco e se ele é válido no Stripe
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      console.log('Verificando customer_id existente:', existingCustomer.customer_id);
      
      // Tentar validar o customer no Stripe antes de usar
      try {
        const stripeResponse = await fetch(`https://api.stripe.com/v1/customers/${existingCustomer.customer_id}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY || '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'}`,
          },
        });
        
        if (!stripeResponse.ok) {
          console.log('Customer inválido no Stripe, será criado um novo');
          // Marcar como deletado para forçar criação de novo
          await supabase
            .from('stripe_customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          console.log('Customer válido no Stripe:', existingCustomer.customer_id);
        }
      } catch (error) {
        console.log('Erro ao validar customer, será criado um novo:', error);
        // Marcar como deletado para forçar criação de novo
        await supabase
          .from('stripe_customers')
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }

    // Validar ambiente antes de criar checkout
    const validation = validateStripeEnvironment();
    if (!validation.isValid) {
      throw new Error(validation.message || 'Erro de configuração do Stripe');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        mode: 'subscription',
        success_url: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/?page=pricing`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('URL de checkout não recebida do servidor');
    }

    return data;
  } catch (error) {
    console.error('Erro no checkout:', error);
    throw error;
  }
import { supabase } from './lib/supabase';
};