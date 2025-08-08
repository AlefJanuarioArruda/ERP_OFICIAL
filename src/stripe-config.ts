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
    id: 'prod_SmuQU2jNMB7UT5',
    priceId: 'price_1RrKbb2LIhrob5CcVzLCY4bb',
    name: 'Plano Anual',
    description: 'Acesso completo ao ERP Smart por 12 meses com desconto especial',
    mode: 'subscription',
    price: 69990, // R$ 699.90 in cents
    currency: 'brl',
    interval: 'year'
  },
  {
    id: 'prod_SmuPGRU6PiFg9F',
    priceId: 'price_1RrKau2LIhrob5Cc2ebLQ39z',
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses',
    mode: 'subscription',
    price: 34990, // R$ 349.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_SmrYTaw1sxvCNr',
    priceId: 'price_1RrHpa2LIhrob5CcdfQKImKv',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart por 1 mês',
    mode: 'subscription',
    price: 5990, // R$ 59.90 in cents
    currency: 'brl',
    interval: 'month'
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