import React, { useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Package, Users, ShoppingCart } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { AIInsightCard } from '../components/AIInsightCard';
import { useSupabaseData } from '../hooks/useSupabaseData';


declare global {
  interface Window {
    gtag: (command: string, targetId: string, params?: object) => void;
  }
}

export const Dashboard: React.FC = () => {
  const { dashboardMetrics, aiInsights, markInsightAsRead, products, customers, sales, loading } = useSupabaseData();

   // 2. Use o hook useEffect para disparar a tag quando o componente montar
  useEffect(() => {
    // Verifica se a função gtag está disponível na window antes de chamá-la
    if (window.gtag) {
      window.gtag('config', 'AW-11484241332');
      console.log("Evento de visualização do Dashboard enviado para o Google Ads.");
    }
  }, []);

  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter(product => product.stock <= product.min_stock);
  const recentSales = sales.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(dashboardMetrics.revenue.current)}
          change={dashboardMetrics.revenue.change?.toFixed(2)}
          changeLabel="vs mês anterior"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(dashboardMetrics.profit.current)}
          change={dashboardMetrics.profit.change?.toFixed(2)}
          changeLabel="vs mês anterior"
          icon={<TrendingUp className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Despesas"
          value={formatCurrency(dashboardMetrics.expenses.current)}
          change={dashboardMetrics.expenses.change?.toFixed(2)}
          changeLabel="vs mês anterior"
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
        />
        <MetricCard
          title="Vendas Realizadas"
          value={dashboardMetrics.sales.current.toString()}
          change={dashboardMetrics.sales.change?.toFixed(2)}
          changeLabel="vs mês anterior"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="yellow"
   
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Seus Insights de IA
            </h2>
            <div className="space-y-4">
              {aiInsights.length > 0 ? (
                aiInsights.slice(0, 3).map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    insight={{
                      id: insight.id,
                      type: insight.type,
                      title: insight.title,
                      description: insight.description,
                      priority: insight.priority,
                      category: insight.category,
                      data: insight.data,
                      createdAt: new Date(insight.created_at),
                      isRead: insight.is_read
                    }}
                    onMarkAsRead={markInsightAsRead}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum insight disponível</p>
                  <p className="text-sm">Continue usando o sistema para gerar insights personalizados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-amber-600" />
              Seus Alertas de Estoque
            </h3>
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600">Estoque: {product.stock} unidades</p>
                    </div>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      Baixo
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum alerta de estoque</p>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
              Suas Vendas Recentes
            </h3>
            <div className="space-y-3">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{sale.customer_name}</p>
                      <p className="text-xs text-gray-600">{sale.invoice_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 text-sm">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma venda realizada ainda</p>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Sua Conta</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Produtos</span>
                <span className="font-medium text-gray-900">{products.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Clientes</span>
                <span className="font-medium text-gray-900">{customers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Vendas Realizadas</span>
                <span className="font-medium text-gray-900">{sales.length} </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};