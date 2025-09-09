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
    id: 'prod_Spd8ywFKVVz3xZ',
    priceId: 'price_1RtxscRyTupwgwOOkhNcILCM',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    mode: 'subscription',
    price: 33990, // R$ 339.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_Spd8crH2AN5efk',
    priceId: 'price_1RtxsARyTupwgwOO31bFKE6N',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    mode: 'subscription',
    price: 5990, // R$ 59.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_Spd7F9eq5wAMJ7',
    priceId: 'price_1RtxrdRyTupwgwOO6wxulMvw',
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com máximo desconto',
    mode: 'subscription',
    price: 68990, // R$ 689.90 in cents
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