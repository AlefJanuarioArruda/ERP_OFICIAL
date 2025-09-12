import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User,
  Brain,
  Crown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, signOut } = useAuth();
  const usageStatus = useUsageLimits();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', icon: Home, page: 'dashboard' },
    { name: 'Clientes', icon: Users, page: 'customers' },
    { name: 'Produtos', icon: Package, page: 'products' },
    { name: 'Vendas', icon: ShoppingCart, page: 'sales' },
    { name: 'Financeiro', icon: FileText, page: 'finance' },
    { name: 'Relatórios', icon: TrendingUp, page: 'reports' },
    { name: 'IA Insights', icon: Brain, page: 'ai-insights' },
    { name: 'Configurações', icon: Settings, page: 'settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">MeuNegócio</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Subscription Status */}
        {!usageStatus.isSubscriptionActive && (
          <div className="absolute bottom-20 left-3 right-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center mb-2">
                <Crown className="w-5 h-5 mr-2" />
                <span className="font-semibold">Plano Gratuito</span>
              </div>
              <p className="text-sm opacity-90 mb-3">
                Upgrade para recursos ilimitados
              </p>
              <button
                onClick={() => onNavigate('pricing')}
                className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Fazer Upgrade
              </button>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user?.user_metadata?.full_name || 'Usuário'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || user?.email || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 lg:hidden" />
            
            <div className="flex items-center space-x-4">
              {/* User menu for mobile */}
              <div className="lg:hidden flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user?.user_metadata?.full_name || 'Usuário'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};