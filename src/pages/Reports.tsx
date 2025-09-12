import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Package, Users, FileText, Crown } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Reports: React.FC = () => {
  const { products, customers, sales, financialRecords, loading } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }

    if (format === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sales sheet
    const salesData = sales.map(sale => ({
      'Data': new Date(sale.created_at).toLocaleDateString(),
      'Cliente': sale.customer_name,
      'Total': sale.total,
      'Método de Pagamento': sale.payment_method,
      'Status': sale.status
    }));
    const salesSheet = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesSheet, 'Vendas');
    
    // Products sheet
    const productsData = products.map(product => ({
      'Nome': product.name,
      'SKU': product.sku,
      'Preço': product.price,
      'Estoque': product.stock,
      'Categoria': product.category
    }));
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, productsSheet, 'Produtos');
    
    XLSX.writeFile(wb, `relatorio-erp-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório ERP Smart', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Sales table
    const salesTableData = sales.slice(0, 10).map(sale => [
      new Date(sale.created_at).toLocaleDateString(),
      sale.customer_name,
      `R$ ${sale.total.toFixed(2)}`,
      sale.payment_method,
      sale.status
    ]);
    
    (doc as any).autoTable({
      head: [['Data', 'Cliente', 'Total', 'Pagamento', 'Status']],
      body: salesTableData,
      startY: 50,
      theme: 'grid'
    });
    
    doc.save(`relatorio-erp-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate metrics based on selected period
  const getMetricsForPeriod = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodSales = sales.filter(sale => new Date(sale.created_at) >= startDate);
    const periodFinancial = financialRecords.filter(record => new Date(record.created_at) >= startDate);

    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalIncome = periodFinancial
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = periodFinancial
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const profit = totalIncome - totalExpenses;

    return {
      totalRevenue,
      totalIncome,
      totalExpenses,
      profit,
      salesCount: periodSales.length,
      averageTicket: periodSales.length > 0 ? totalRevenue / periodSales.length : 0
    };
  };

  const metrics = getMetricsForPeriod();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">
            Análises detalhadas do seu negócio
            {!usageStatus.isSubscriptionActive && (
              <span className="text-amber-600 font-medium"> (Exportação Premium)</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Última Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={!usageStatus.isSubscriptionActive}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                usageStatus.isSubscriptionActive
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </button>
            
            <button
              onClick={() => handleExport('pdf')}
              disabled={!usageStatus.isSubscriptionActive}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                usageStatus.isSubscriptionActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Premium Banner for Non-Subscribers */}
      {!usageStatus.isSubscriptionActive && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-900">Relatórios Premium</h3>
                <p className="text-amber-700">
                  Assine para exportar relatórios em Excel e PDF, além de análises avançadas
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Assinar Agora
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.profit)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas Realizadas</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.salesCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.averageTicket)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Período</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Gráfico de vendas em desenvolvimento</p>
              <p className="text-sm">Dados: {sales.length} vendas registradas</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-4">
            {(() => {
              const productSales = new Map();
              sales.forEach(sale => {
                if (sale.items) {
                  sale.items.forEach((item: any) => {
                    const current = productSales.get(item.product_name) || { quantity: 0, revenue: 0 };
                    productSales.set(item.product_name, {
                      quantity: current.quantity + item.quantity,
                      revenue: current.revenue + item.total
                    });
                  });
                }
              });
              
              const topProducts = Array.from(productSales.entries())
                .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
                .slice(0, 5);

              if (topProducts.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma venda registrada ainda</p>
                  </div>
                );
              }

              return topProducts.map(([name, data]: any, index: number) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-sm text-gray-600">{data.quantity} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(data.revenue)}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sale.customer_name}</p>
                  <p className="text-sm text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{formatCurrency(sale.total)}</p>
                  <p className="text-sm text-gray-600">{sale.payment_method}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma venda registrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Receitas</span>
              <span className="font-semibold text-green-600">{formatCurrency(metrics.totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-gray-700">Despesas</span>
              <span className="font-semibold text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t-2 border-blue-200">
              <span className="font-medium text-gray-900">Lucro Líquido</span>
              <span className={`font-bold text-lg ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.profit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Funcionalidade Premium"
        message="A exportação de relatórios é uma funcionalidade premium. Assine para ter acesso completo."
      />
    </div>
  );
};