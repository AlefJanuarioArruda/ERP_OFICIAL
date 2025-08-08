import React from 'react';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

interface UsageLimitBannerProps {
  onUpgrade: () => void;
  onDismiss?: () => void;
}

export const UsageLimitBanner: React.FC<UsageLimitBannerProps> = ({ onUpgrade, onDismiss }) => {
  const { isSubscriptionActive, getCurrentPlan } = useStripe();

  // Don't show banner if subscription is active
  if (isSubscriptionActive()) return null;

  const currentPlan = getCurrentPlan();
  const isExpired = currentPlan !== 'Nenhum plano ativo' && !isSubscriptionActive();

  return (
    <div className={`${
      isExpired 
        ? 'bg-red-50 border-red-200' 
        : 'bg-amber-50 border-amber-200'
    } border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
            isExpired 
              ? 'bg-red-100' 
              : 'bg-amber-100'
          }`}>
            {isExpired ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <Crown className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h4 className={`font-semibold ${
              isExpired ? 'text-red-900' : 'text-amber-900'
            }`}>
              {isExpired 
                ? 'Sua assinatura expirou' 
                : 'Limite de uso gratuito atingido'
              }
            </h4>
            <p className={`text-sm ${
              isExpired ? 'text-red-700' : 'text-amber-700'
            }`}>
              {isExpired 
                ? 'Renove para continuar utilizando todos os recursos.'
                : 'Assine para continuar usando sem restrições.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onUpgrade}
            className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${
              isExpired
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isExpired ? 'Renovar Assinatura' : 'Assinar Agora'}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};