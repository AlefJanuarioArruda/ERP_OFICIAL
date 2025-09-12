import React, { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Package, Users, FileText, Crown, Filter, X } from 'lucide-react';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    customerType: 'all' // 'all', 'with_customer', 'direct'
  });

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
    const filteredSalesData = getFilteredSales();
    
    const wb = XLSX.utils.book_new();
    
    // Sales sheet
    const salesData = filteredSalesData.map(sale => ({
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
    const filteredSalesData = getFilteredSales();
    
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório ERP Smart', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Sales table
    const salesTableData = filteredSalesData.slice(0, 10).map(sale => [
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

  // Apply advanced filters to sales data
  const getFilteredSales = () => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      
      // Date filters
      if (filters.dateFrom && saleDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && saleDate > new Date(filters.dateTo + 'T23:59:59')) return false;
      
      // Payment method filter
      if (filters.paymentMethod && sale.payment_method !== filters.paymentMethod) return false;
      
      // Amount filters
      if (filters.minAmount && sale.total < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && sale.total > parseFloat(filters.maxAmount)) return false;
      
      // Customer type filter
      if (filters.customerType === 'with_customer' && !sale.customer_id) return false;
      if (filters.customerType === 'direct' && sale.customer_id) return false;
      
      return true;
    });
  };

  // Calculate metrics based on selected period and filters
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

    const filteredSales = getFilteredSales();
    const periodSales = filteredSales.filter(sale => new Date(sale.created_at) >= startDate);
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

  // Generate chart data for sales
  const getSalesChartData = () => {
    const filteredSales = getFilteredSales();
    const now = new Date();
    const days = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayRevenue = filteredSales
        .filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate.toDateString() === date.toDateString();
        })
        .reduce((sum, sale) => sum + sale.total, 0);
      
      days.push({ day: dayName, revenue: dayRevenue });
    }
    
    return days;
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      customerType: 'all'
    });
  };

  const metrics = getMetricsForPeriod();
  const chartData = getSalesChartData();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

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
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
          </button>
          
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

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="pix">PIX</option>
                <option value="card">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
              <select
                value={filters.customerType}
                onChange={(e) => setFilters({...filters, customerType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="with_customer">Com Cliente</option>
                <option value="direct">Venda Direta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
              <input
                type="number"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="R$ 0,00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
              <input
                type="number"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="R$ 999,99"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 7 Dias</h3>
          <div className="h-64">
            {chartData.some(d => d.revenue > 0) ? (
              <div className="h-full flex items-end justify-between space-x-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-48">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 relative group"
                        style={{
                          height: `${(data.revenue / maxRevenue) * 100}%`,
                          minHeight: data.revenue > 0 ? '8px' : '0px'
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-600">{data.day}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma venda no período selecionado</p>
                  <p className="text-sm">Ajuste os filtros para ver dados</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-4">
            {(() => {
              const filteredSales = getFilteredSales();
              const productSales = new Map();
              
              filteredSales.forEach(sale => {
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
                    <p>Nenhuma venda no período filtrado</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Filtradas</h3>
          <div className="space-y-3">
            {(() => {
              const filteredSales = getFilteredSales();
              return filteredSales.slice(0, 5).map((sale) => (
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
              ));
            })()}
            {getFilteredSales().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma venda encontrada com os filtros aplicados</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise por Categoria</h3>
          <div className="space-y-4">
            {(() => {
              const filteredFinancial = financialRecords.filter(record => {
                const recordDate = new Date(record.created_at);
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
                
                return recordDate >= startDate;
              });
              
              // Group by category
              const categoryData = new Map();
              filteredFinancial.forEach(record => {
                const current = categoryData.get(record.category) || { income: 0, expense: 0, count: 0 };
                if (record.type === 'income' && record.status === 'paid') {
                  current.income += record.amount;
                } else if (record.type === 'expense' && record.status === 'paid') {
                  current.expense += record.amount;
                }
                current.count += 1;
                categoryData.set(record.category, current);
              });
              
              const topCategories = Array.from(categoryData.entries())
                .sort((a: any, b: any) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
                .slice(0, 5);

              if (topCategories.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum registro financeiro no período</p>
                  </div>
                );
              }

              return topCategories.map(([category, data]: any) => (
                <div key={category} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{category}</span>
                    <span className="text-sm text-gray-600">{data.count} transações</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {data.income > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600">Receitas:</span>
                        <span className="font-medium text-green-600">{formatCurrency(data.income)}</span>
                      </div>
                    )}
                    {data.expense > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Despesas:</span>
                        <span className="font-medium text-red-600">{formatCurrency(data.expense)}</span>
                      </div>
                    )}
                  </div>
                  {data.income > 0 && data.expense > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saldo:</span>
                        <span className={`font-medium ${(data.income - data.expense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(data.income - data.expense)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ));
            })()}
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