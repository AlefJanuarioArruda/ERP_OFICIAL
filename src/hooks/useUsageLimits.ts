import { useMemo } from 'react';
import { useStripe } from './useStripe';
import { useSupabaseData } from './useSupabaseData';

export interface UsageLimits {
  products: number;
  customers: number;
  sales: number;
}

export interface UsageStatus {
  isSubscriptionActive: boolean;
  limits: UsageLimits;
  current: {
    products: number;
    customers: number;
    sales: number;
  };
  canAdd: {
    products: boolean;
    customers: boolean;
    sales: boolean;
  };
  canEdit: boolean;
  canDelete: boolean;
  isLimitReached: {
    products: boolean;
    customers: boolean;
    sales: boolean;
  };
  showLimitMessage: {
    products: boolean;
    customers: boolean;
    sales: boolean;
  };
}

const FREE_TIER_LIMITS: UsageLimits = {
  products: 5,
  customers: 5,
  sales: 5
};

export const useUsageLimits = (): UsageStatus => {
  const { isSubscriptionActive, loading } = useStripe()
  const { products, customers, sales } = useSupabaseData();

  const usageStatus = useMemo(() => {
    // If still loading subscription data, be conservative and allow access
    if (loading) {
      return {
        isSubscriptionActive: true, // Temporarily allow access while loading
        limits: FREE_TIER_LIMITS,
        current: {
          products: products.length,
          customers: customers.length,
          sales: sales.length
        },
        canAdd: {
          products: true,
          customers: true,
          sales: true
        },
        canEdit: true,
        canDelete: true,
        isLimitReached: {
          products: false,
          customers: false,
          sales: false
        },
        showLimitMessage: {
          products: false,
          customers: false,
          sales: false
        }
      };
    }

    const subscriptionActive = isSubscriptionActive()
    const limits = FREE_TIER_LIMITS;
    
    const current = {
      products: products.length,
      customers: customers.length,
      sales: sales.length
    };

    // Para assinantes: acesso total
    if (subscriptionActive) {
      return {
        isSubscriptionActive: true,
        limits,
        current,
        canAdd: {
          products: true,
          customers: true,
          sales: true
        },
        canEdit: true,
        canDelete: true,
        isLimitReached: {
          products: false,
          customers: false,
          sales: false
        },
        showLimitMessage: {
          products: false,
          customers: false,
          sales: false
        }
      };
    }

    // Para usuários gratuitos: PODEM editar e excluir sempre (conforme especificação)
    const isLimitReached = {
      products: current.products >= limits.products,
      customers: current.customers >= limits.customers,
      sales: current.sales >= limits.sales
    };

    // Usuários gratuitos podem adicionar apenas se não atingiram o limite
    const canAdd = {
      products: !isLimitReached.products,
      customers: !isLimitReached.customers,
      sales: !isLimitReached.sales
    };

    // Usuários gratuitos NÃO podem editar/excluir quando atingem o limite ESPECÍFICO de cada seção
    const canEdit = {
      products: !isLimitReached.products,
      customers: !isLimitReached.customers,
      sales: !isLimitReached.sales
    };
    
    const canDelete = {
      products: !isLimitReached.products,
      customers: !isLimitReached.customers,
      sales: !isLimitReached.sales
    };

    const showLimitMessage = {
      products: isLimitReached.products,
      customers: isLimitReached.customers,
      sales: isLimitReached.sales
    };

    return {
      isSubscriptionActive: false,
      limits,
      current,
      canAdd,
      canEdit,
      canDelete,
      isLimitReached,
      showLimitMessage
    };
  }, [isSubscriptionActive, loading, products.length, customers.length, sales.length]);

  return usageStatus;
};