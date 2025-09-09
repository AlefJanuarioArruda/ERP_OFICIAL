import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { stripeProducts, getProductByPriceId, type StripeProduct } from '../stripe-config';

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
      setLoading(true);
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
      setError(null);
    } catch (err) {
      console.error('Unexpected error fetching subscription:', err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
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
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
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
    const isActive = subscription.subscription_status && ['active', 'trialing'].includes(subscription.subscription_status);

    return { product, isActive };
  };

  const isSubscriptionActive = (): boolean => {
    if (!subscription) return false;
    return subscription.subscription_status && ['active', 'trialing'].includes(subscription.subscription_status);
  };


const getCurrentPlan = (): string => {
  const { product, isActive } = getActiveSubscription();

  if (!product || !isActive) {
    return 'Nenhum plano ativo';
  }

  return product.name;
};

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      
      await Promise.all([
        fetchSubscription(),
        fetchOrders()
      ]);
    };

    loadData();
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
      setLoading(true);
      fetchSubscription();
      fetchOrders();
    },
    products: stripeProducts,
  };
};