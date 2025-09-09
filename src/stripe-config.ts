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
    id: 'prod_T1FAK1uqgZkta9',
    priceId: 'price_1S5CgDRyTupwgwOO1LH6xXol',
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    mode: 'subscription',
    price: 2990, // R$ 29.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'prod_T1WOCHWCx1cIUN',
    priceId: 'price_1S5TLo2LIhrob5Cc5AZQGT69',
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