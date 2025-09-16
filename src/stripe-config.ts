export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_T1FAZ6vxP70anf',
    priceId: 'price_1S5CgcRyTupwgwOOZJa8yy4A',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    mode: 'subscription',
    price: 14990, // R$ 149.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_T1WZTKyMKXUc2s',
    priceId: 'price_1S5TWgRyTupwgwOOoqom8a57',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    mode: 'subscription',
    price: 2990, // R$ 29.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_T1FBZMsJ1G5oRQ',
    priceId: 'price_1S5CgwRyTupwgwOOuSFgfryG',
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com máximo desconto',
    mode: 'subscription',
    price: 25990, // R$ 259.90 in cents
    currency: 'brl',
    interval: 'year'
  }
];
export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

// Get the base URL for the application
export const getBaseUrl = () => {
  return window.location.origin;
};

// Get success URL for Stripe checkout
export const getSuccessUrl = () => {
  return `${getBaseUrl()}/success?session_id={CHECKOUT_SESSION_ID}`;
};

// Get cancel URL for Stripe checkout
export const getCancelUrl = () => {
  return `${getBaseUrl()}/pricing`;
};

export const formatPrice = (price: number, currency: string = 'brl'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};