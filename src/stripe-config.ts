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
    id: 'prod_monthly',
    priceId: 'price_1RtxsARyTupwgwOO31bFKE6N',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    mode: 'subscription',
    price: 2990, // R$ 29.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_semestral',
    priceId: 'price_1RtxscRyTupwgwOOkhNcILCM',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    mode: 'subscription',
    price: 14990, // R$ 149.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_annual',
    priceId: 'price_1RtxrdRyTupwgwOO6wxulMvw',
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

export const formatPrice = (price: number, currency: string = 'brl'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price / 100);
};