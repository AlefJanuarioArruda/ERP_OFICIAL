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

// TODO: Replace these placeholder price IDs with your actual Stripe Price IDs
// Go to your Stripe Dashboard > Products > Pricing to find the correct Price IDs
export const stripeProducts: StripeProduct[] = [
  {
    id: 'plano-mensal',
    priceId: 'price_1OTestMonthlyPriceId', // Replace with actual price ID from Stripe
    name: 'Plano Mensal',
    description: 'Acesso completo ao ERP Smart com flexibilidade mensal',
    mode: 'subscription',
    price: 2990, // R$ 29.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'plano-semestral',
    priceId: 'price_1OTestSemestralPriceId', // Replace with actual price ID from Stripe
    name: 'Plano Semestral',
    description: 'Acesso completo ao ERP Smart por 6 meses com melhor custo-benefício',
    mode: 'subscription',
    price: 14990, // R$ 149.90 in cents
    currency: 'brl',
    interval: 'month'
  },
  {
    id: 'plano-anual',
    priceId: 'price_1OTestAnnualPriceId', // Replace with actual price ID from Stripe
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