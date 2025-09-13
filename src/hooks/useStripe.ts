import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { stripeProducts, getProductByPriceId, getSuccessUrl, getCancelUrl, type StripeProduct } from '../stripe-config';

interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

interface OrderData {
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const useStripe = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setError('Failed to fetch subscription data');
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Unexpected error fetching subscription:', err);
      setError('Unexpected error occurred');
    }
  };

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch order data');
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
      setError('Unexpected error occurred');
    }
  };

  const createCheckoutSession = async (
    priceId: string,
    mode: 'payment' | 'subscription' = 'subscription'
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'No valid session found' };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: getSuccessUrl(),
          cancel_url: getCancelUrl(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create checkout session' };
      }

      return { success: true, url: result.url };
    } catch (err) {
      console.error('Error creating checkout session:', err);
      return { success: false, error: 'Failed to create checkout session' };
    }
  };

  const getActiveSubscription = (): { product: StripeProduct | null; isActive: boolean } => {
    if (!subscription || !subscription.price_id) {
      return { product: null, isActive: false };
    }

    const product = getProductByPriceId(subscription.price_id);
    const isActive = ['active', 'trialing'].includes(subscription.subscription_status);

    return { product, isActive };
  };

  const isSubscriptionActive = (): boolean => {
    const { isActive } = getActiveSubscription();
    const currentPlan = getCurrentPlan();
    
    // Se o plano atual é "Nenhum plano ativo", a assinatura está desativada
    if (currentPlan === 'Nenhum plano ativo') {
      return false;
    }
    
    return isActive;
  };


const getCurrentPlan = (): string => {
  const { product, isActive } = getActiveSubscription();

  // Se não há produto ou a assinatura não está ativa, retorna "Nenhum plano ativo"
  if (!product || !isActive) {
    return 'Nenhum plano ativo';
  }

  // Se há produto e está ativo, retorna o nome do plano
  return `${product.name} Ativo`;
};

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSubscription(),
        fetchOrders()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Additional effect to handle URL parameters for successful payments
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    // If we have a session_id in URL, it means user just completed payment
    // Force refresh after a delay to allow webhook processing
    if (sessionId && user) {
      const timer = setTimeout(() => {
        console.log('Refreshing subscription data after successful payment...');
        fetchSubscription();
        fetchOrders();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  return {
    subscription,
    orders,
    loading,
    error,
    createCheckoutSession,
    getActiveSubscription,
    isSubscriptionActive,
    getCurrentPlan,
    refetch: () => {
      fetchSubscription();
      fetchOrders();
    },
    products: stripeProducts,
  };
};