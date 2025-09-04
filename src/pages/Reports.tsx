import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, Package, Users, FileText, Filter, Upload, Eye, EyeOff, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UsageLimitBanner } from '../components/UsageLimitBanner';
import { UpgradeModal } from '../components/UpgradeModal';
import * as XLSX from 'xlsx';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
  type: string;
  reportType: 'all' | 'products' | 'customers' | 'sales' | 'financial';
}

export const Reports: React.FC = () => {
  const { 
    products, 
    customers, 
    sales, 
    financialRecords, 
    addProduct,
    addCustomer,
    addFinancialRecord,
    loading 
  } = useSupabaseData();
  const usageStatus = useUsageLimits();

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: '',
    type: '',
    reportType: 'all'
  });

  const [visibleColumns, setVisibleColumns] = useState({
    products: { name: true, category: true, price: true, stock: true, supplier: true },
    customers: { name: true, email: true, phone: true, totalPurchases: true, lastPurchase: true },
    sales: { customerName: true, total: true, paymentMethod: true, status: true, createdAt: true },
    financial: { description: true, type: true, amount: true, status: true, dueDate: true }
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'products' | 'customers' | 'financial'>('products');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filterByDate = (date: string) => {
      if (!filters.dateFrom && !filters.dateTo) return true;
      const itemDate = new Date(date);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date('1900-01-01');
      const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-12-31');
      return itemDate >= fromDate && itemDate <= toDate;
    };

    const filteredProducts = products.filter(product => {
      if (filters.reportType !== 'all' && filters.reportType !== 'products') return false;
      if (filters.category && !product.category.toLowerCase().includes(filters.category.toLowerCase())) return false;
      return filterByDate(product.created_at);
    });

    const filteredCustomers = customers.filter(customer => {
      if (filters.reportType !== 'all' && filters.reportType !== 'customers') return false;
      return filterByDate(customer.created_at);
    });

    const filteredSales = sales.filter(sale => {
      if (filters.reportType !== 'all' && filters.reportType !== 'sales') return false;
      if (filters.status && sale.status !== filters.status) return false;
      return filterByDate(sale.created_at);
    });

    const filteredFinancial = financialRecords.filter(record => {
      if (filters.reportType !== 'all' && filters.reportType !== 'financial') return false;
      if (filters.type && record.type !== filters.type) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.category && !record.category.toLowerCase().includes(filters.category.toLowerCase())) return false;
      return filterByDate(record.created_at);
    });

    return {
      products: filteredProducts,
      customers: filteredCustomers,
      sales: filteredSales,
      financial: filteredFinancial
    };
  }, [products, customers, sales, financialRecords, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const exportToExcel = async () => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Helper function to format currency values for Excel
      const formatCurrencyForExcel = (value: number) => {
        return parseFloat(value.toFixed(2));
      };

      // Export Products if visible
      if (filteredData.products.length > 0 && (filters.reportType === 'all' || filters.reportType === 'products')) {
        const productsData = filteredData.products.map(product => ({
          'Nome': product.name,
          'Categoria': product.category,
          'Descrição': product.description || '',
          'Preço de Venda': formatCurrencyForExcel(product.price),
          'Preço de Custo': formatCurrencyForExcel(product.cost_price),
          'Estoque': product.stock,
          'Estoque Mínimo': product.min_stock,
          'SKU': product.sku,
          'Fornecedor': product.supplier || '',
          'Data de Criação': formatDate(product.created_at),
          'Última Atualização': formatDate(product.updated_at)
        }));
        
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        
        // Set column widths
        const productsColWidths = [
          { wch: 25 }, // Nome
          { wch: 15 }, // Categoria
          { wch: 30 }, // Descrição
          { wch: 15 }, // Preço de Venda
          { wch: 15 }, // Preço de Custo
          { wch: 10 }, // Estoque
          { wch: 15 }, // Estoque Mínimo
          { wch: 15 }, // SKU
          { wch: 20 }, // Fornecedor
          { wch: 15 }, // Data de Criação
          { wch: 18 }  // Última Atualização
        ];
        productsSheet['!cols'] = productsColWidths;
        
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');
      }

      // Export Customers if visible
      if (filteredData.customers.length > 0 && (filters.reportType === 'all' || filters.reportType === 'customers')) {
        const customersData = filteredData.customers.map(customer => ({
          'Nome': customer.name,
          'Email': customer.email,
          'Telefone': customer.phone,
          'Documento': customer.document,
          'Endereço': customer.address_street,
          'Cidade': customer.address_city,
          'Estado': customer.address_state,
          'CEP': customer.address_zip_code,
          'Total de Compras': formatCurrencyForExcel(customer.total_purchases),
          'Última Compra': customer.last_purchase ? formatDate(customer.last_purchase) : 'Nunca',
          'Data de Cadastro': formatDate(customer.created_at)
        }));
        
        const customersSheet = XLSX.utils.json_to_sheet(customersData);
        
        // Set column widths
        const customersColWidths = [
          { wch: 25 }, // Nome
          { wch: 30 }, // Email
          { wch: 15 }, // Telefone
          { wch: 18 }, // Documento
          { wch: 35 }, // Endereço
          { wch: 20 }, // Cidade
          { wch: 10 }, // Estado
          { wch: 12 }, // CEP
          { wch: 18 }, // Total de Compras
          { wch: 15 }, // Última Compra
          { wch: 18 }  // Data de Cadastro
        ];
        customersSheet['!cols'] = customersColWidths;
        
        XLSX.utils.book_append_sheet(workbook, customersSheet, 'Clientes');
      }

      // Export Sales if visible
      if (filteredData.sales.length > 0 && (filters.reportType === 'all' || filters.reportType === 'sales')) {
        const salesData = filteredData.sales.map(sale => ({
          'Número da Nota': sale.invoice_number || '',
          'Cliente': sale.customer_name,
          'Total': formatCurrencyForExcel(sale.total),
          'Subtotal': formatCurrencyForExcel(sale.subtotal),
          'Desconto': formatCurrencyForExcel(sale.discount),
          'Taxa': formatCurrencyForExcel(sale.tax),
          'Método de Pagamento': sale.payment_method.toUpperCase(),
          'Status do Pagamento': sale.payment_status === 'paid' ? 'Pago' : sale.payment_status === 'pending' ? 'Pendente' : 'Vencido',
          'Status da Venda': sale.status === 'completed' ? 'Concluída' : sale.status === 'pending' ? 'Pendente' : 'Cancelada',
          'Data da Venda': formatDate(sale.created_at),
          'Data de Vencimento': sale.due_date ? formatDate(sale.due_date) : ''
        }));
        
        const salesSheet = XLSX.utils.json_to_sheet(salesData);
        
        // Set column widths
        const salesColWidths = [
          { wch: 18 }, // Número da Nota
          { wch: 25 }, // Cliente
          { wch: 15 }, // Total
          { wch: 15 }, // Subtotal
          { wch: 12 }, // Desconto
          { wch: 10 }, // Taxa
          { wch: 18 }, // Método de Pagamento
          { wch: 18 }, // Status do Pagamento
          { wch: 18 }, // Status da Venda
          { wch: 15 }, // Data da Venda
          { wch: 18 }  // Data de Vencimento
        ];
        salesSheet['!cols'] = salesColWidths;
        
        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Vendas');
      }

      // Export Financial Records if visible
      if (filteredData.financial.length > 0 && (filters.reportType === 'all' || filters.reportType === 'financial')) {
        const financialData = filteredData.financial.map(record => ({
          'Descrição': record.description,
          'Tipo': record.type === 'income' ? 'Receita' : 'Despesa',
          'Categoria': record.category,
          'Valor': formatCurrencyForExcel(record.amount),
          'Status': record.status === 'paid' ? 'Pago' : record.status === 'pending' ? 'Pendente' : 'Vencido',
          'Data de Vencimento': formatDate(record.due_date),
          'Data de Pagamento': record.paid_date ? formatDate(record.paid_date) : '',
          'Data de Criação': formatDate(record.created_at)
        }));
        
        const financialSheet = XLSX.utils.json_to_sheet(financialData);
        
        // Set column widths
        const financialColWidths = [
          { wch: 35 }, // Descrição
          { wch: 12 }, // Tipo
          { wch: 20 }, // Categoria
          { wch: 15 }, // Valor
          { wch: 12 }, // Status
          { wch: 18 }, // Data de Vencimento
          { wch: 18 }, // Data de Pagamento
          { wch: 18 }  // Data de Criação
        ];
        financialSheet['!cols'] = financialColWidths;
        
        XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financeiro');
      }

      // Create summary sheet
      const summaryData = [
        { 'Categoria': 'Produtos', 'Quantidade': filteredData.products.length },
        { 'Categoria': 'Clientes', 'Quantidade': filteredData.customers.length },
        { 'Categoria': 'Vendas', 'Quantidade': filteredData.sales.length },
        { 'Categoria': 'Transações Financeiras', 'Quantidade': filteredData.financial.length },
        { 'Categoria': '', 'Quantidade': '' },
        { 'Categoria': 'Relatório gerado em:', 'Quantidade': new Date().toLocaleString('pt-BR') },
        { 'Categoria': 'Filtros aplicados:', 'Quantidade': '' },
        { 'Categoria': '- Tipo de Relatório', 'Quantidade': filters.reportType === 'all' ? 'Todos' : filters.reportType },
        { 'Categoria': '- Data Inicial', 'Quantidade': filters.dateFrom || 'Não definida' },
        { 'Categoria': '- Data Final', 'Quantidade': filters.dateTo || 'Não definida' },
        { 'Categoria': '- Categoria', 'Quantidade': filters.category || 'Todas' },
        { 'Categoria': '- Status', 'Quantidade': filters.status || 'Todos' },
        { 'Categoria': '- Tipo', 'Quantidade': filters.type || 'Todos' }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      // Generate filename with current date and filters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const reportTypeStr = filters.reportType === 'all' ? 'Completo' : filters.reportType;
      const filename = `Relatorio_${reportTypeStr}_${dateStr}_${timeStr}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);
      
      showNotification('success', `✅ Relatório exportado com sucesso! Arquivo: ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
      showNotification('error', '❌ Erro ao exportar relatório. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const validateRequiredFields = (data: any[], type: string): { isValid: boolean; missingFields: string[] } => {
    if (data.length === 0) {
      return { isValid: false, missingFields: ['Nenhum dado encontrado na planilha'] };
    }

    const requiredFields = {
      products: ['nome', 'categoria', 'preço', 'preço de custo', 'estoque', 'sku'],
      customers: ['nome', 'email', 'telefone', 'documento'],
      financial: ['descrição', 'tipo', 'valor', 'categoria']
    };

    const required = requiredFields[type as keyof typeof requiredFields] || [];
    const firstRow = data[0];
    const availableFields = Object.keys(firstRow).map(key => key.toLowerCase());
    
    const missingFields = required.filter(field => 
      !availableFields.some(available => 
        available.includes(field) || 
        (field === 'preço de custo' && available.includes('cost')) ||
        (field === 'preço' && available.includes('price')) ||
        (field === 'estoque' && available.includes('stock'))
      )
    );

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showNotification('error', 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required fields
        const validation = validateRequiredFields(jsonData, importType);
        if (!validation.isValid) {
          showNotification('error', `Campos obrigatórios ausentes: ${validation.missingFields.join(', ')}`);
          setIsImporting(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const [index, row] of (jsonData as any[]).entries()) {
          try {
            if (importType === 'products') {
              // Validate required product fields
              const name = row.Nome || row.name || row.NOME;
              const category = row.Categoria || row.category || row.CATEGORIA;
              const price = parseFloat(row.Preço || row.price || row.PREÇO || '0');
              const costPrice = parseFloat(row['Preço de Custo'] || row.cost_price || row['PREÇO DE CUSTO'] || '0');
              const stock = parseInt(row.Estoque || row.stock || row.ESTOQUE || '0');
              const sku = row.SKU || row.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              if (!name || !category || price <= 0 || costPrice <= 0) {
                errors.push(`Linha ${index + 2}: Dados inválidos (nome, categoria, preço ou preço de custo)`);
                errorCount++;
                continue;
              }

              await addProduct({
                name,
                description: row.Descrição || row.description || row.DESCRIÇÃO || '',
                price,
                cost_price: costPrice,
                stock,
                min_stock: parseInt(row['Estoque Mínimo'] || row.min_stock || row['ESTOQUE MÍNIMO'] || '0'),
                category,
                sku,
                supplier: row.Fornecedor || row.supplier || row.FORNECEDOR || ''
              });

            } else if (importType === 'customers') {
              // Validate required customer fields
              const name = row.Nome || row.name || row.NOME;
              const email = row.Email || row.email || row.EMAIL;
              const phone = row.Telefone || row.phone || row.TELEFONE;
              const document = row.Documento || row.document || row.DOCUMENTO;

              if (!name || !email || !phone || !document) {
                errors.push(`Linha ${index + 2}: Dados obrigatórios ausentes (nome, email, telefone ou documento)`);
                errorCount++;
                continue;
              }

              // Basic email validation
              if (!email.includes('@')) {
                errors.push(`Linha ${index + 2}: Email inválido`);
                errorCount++;
                continue;
              }

              await addCustomer({
                name,
                email,
                phone,
                document,
                address_street: row.Endereço || row.address || row.ENDEREÇO || '',
                address_city: row.Cidade || row.city || row.CIDADE || '',
                address_state: row.Estado || row.state || row.ESTADO || '',
                address_zip_code: row.CEP || row.zipCode || row.cep || row.ZIP || ''
              });

            } else if (importType === 'financial') {
              // Validate required financial fields
              const description = row.Descrição || row.description || row.DESCRIÇÃO;
              const typeValue = (row.Tipo || row.type || row.TIPO || '').toLowerCase();
              const amount = parseFloat(row.Valor || row.amount || row.VALOR || '0');
              const category = row.Categoria || row.category || row.CATEGORIA;

              if (!description || !typeValue || amount <= 0 || !category) {
                errors.push(`Linha ${index + 2}: Dados obrigatórios ausentes (descrição, tipo, valor ou categoria)`);
                errorCount++;
                continue;
              }

              const type = typeValue.includes('receita') || typeValue.includes('income') ? 'income' : 'expense';

              await addFinancialRecord({
                type,
                category,
                amount,
                description,
                status: 'pending',
                due_date: new Date().toISOString(),
                paid_date: null,
                customer_id: null,
                sale_id: null
              });
            }
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push(`Linha ${index + 2}: Erro ao processar dados`);
            console.error('Error importing row:', row, error);
          }
        }

        // Show detailed results
        if (successCount > 0 && errorCount === 0) {
          showNotification('success', `✅ Importação concluída com sucesso! ${successCount} registros importados.`);
        } else if (successCount > 0 && errorCount > 0) {
          showNotification('error', `⚠️ Importação parcial: ${successCount} sucessos, ${errorCount} erros. Verifique os dados e tente novamente.`);
        } else {
          showNotification('error', `❌ Falha na importação: ${errorCount} erros. Nenhum registro foi importado.`);
        }

        setShowImportModal(false);
        
        // Reset file input
        event.target.value = '';
        
      } catch (error) {
        showNotification('error', 'Erro ao processar arquivo. Verifique se é um arquivo Excel válido.');
        console.error('Import error:', error);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleColumnVisibility = (table: keyof typeof visibleColumns, column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [table]: {
        ...prev[table],
        [column]: !prev[table][column as keyof typeof prev[typeof table]]
      }
    }));
  };

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
      {/* Usage Limit Banner for Non-Subscribers */}
      {!usageStatus.isSubscriptionActive && showBanner && (
        <UsageLimitBanner 
          onUpgrade={() => setShowUpgradeModal(true)}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Relatórios</h1>
          <p className="text-gray-600">
            Análises personalizadas dos seus dados
            {!usageStatus.isSubscriptionActive && (
              <span className="text-amber-600 font-medium"> (Importação/Exportação Premium)</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToExcel}
            disabled={isExporting || !usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              usageStatus.isSubscriptionActive
                ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="hidden sm:inline">Exportando...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {usageStatus.isSubscriptionActive ? 'Exportar para Excel' : 'Exportar (Premium)'}
                </span>
                <span className="sm:hidden">Excel</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            disabled={!usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              usageStatus.isSubscriptionActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">
              {usageStatus.isSubscriptionActive ? 'Importar' : 'Importar (Premium)'}
            </span>
            <span className="sm:hidden">Import</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros Avançados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({...filters, reportType: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="products">Produtos</option>
              <option value="customers">Clientes</option>
              <option value="sales">Vendas</option>
              <option value="financial">Financeiro</option>
            </select>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              placeholder="Filtrar por categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="completo">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Resultados:</span> {filteredData.products.length + filteredData.customers.length + filteredData.sales.length + filteredData.financial.length} registros encontrados
          </div>
          <button
            onClick={() => setFilters({
              dateFrom: '',
              dateTo: '',
              category: '',
              status: '',
              type: '',
              reportType: 'all'
            })}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produtos</p>
              <p className="text-2xl font-bold text-blue-600">{filteredData.products.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-green-600">{filteredData.customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas</p>
              <p className="text-2xl font-bold text-purple-600">{filteredData.sales.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transações</p>
              <p className="text-2xl font-bold text-amber-600">{filteredData.financial.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Products Report */}
      {filteredData.products.length > 0 && (filters.reportType === 'all' || filters.reportType === 'products') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Relatório de Produtos ({filteredData.products.length})
            </h3>
            <div className="flex items-center space-x-2">
              {Object.entries(visibleColumns.products).map(([column, visible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumnVisibility('products', column)}
                  className={`px-2 py-1 text-xs rounded flex items-center ${
                    visible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span className="ml-1 hidden sm:inline">
                    {column === 'name' ? 'Nome' : 
                     column === 'category' ? 'Categoria' : 
                     column === 'price' ? 'Preço' : 
                     column === 'stock' ? 'Estoque' : 
                     column === 'supplier' ? 'Fornecedor' : column}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.products.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>}
                  {visibleColumns.products.category && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>}
                  {visibleColumns.products.price && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>}
                  {visibleColumns.products.stock && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>}
                  {visibleColumns.products.supplier && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    {visibleColumns.products.name && <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>}
                    {visibleColumns.products.category && <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>}
                    {visibleColumns.products.price && <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(product.price)}</td>}
                    {visibleColumns.products.stock && <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>}
                    {visibleColumns.products.supplier && <td className="px-4 py-3 text-sm text-gray-600">{product.supplier || 'N/A'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers Report */}
      {filteredData.customers.length > 0 && (filters.reportType === 'all' || filters.reportType === 'customers') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Relatório de Clientes ({filteredData.customers.length})
            </h3>
            <div className="flex items-center space-x-2">
              {Object.entries(visibleColumns.customers).map(([column, visible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumnVisibility('customers', column)}
                  className={`px-2 py-1 text-xs rounded flex items-center ${
                    visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span className="ml-1 hidden sm:inline">
                    {column === 'name' ? 'Nome' : 
                     column === 'email' ? 'Email' : 
                     column === 'phone' ? 'Telefone' : 
                     column === 'totalPurchases' ? 'Total Compras' : 
                     column === 'lastPurchase' ? 'Última Compra' : column}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.customers.name && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>}
                  {visibleColumns.customers.email && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>}
                  {visibleColumns.customers.phone && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>}
                  {visibleColumns.customers.totalPurchases && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Compras</th>}
                  {visibleColumns.customers.lastPurchase && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Compra</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    {visibleColumns.customers.name && <td className="px-4 py-3 text-sm text-gray-900">{customer.name}</td>}
                    {visibleColumns.customers.email && <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>}
                    {visibleColumns.customers.phone && <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>}
                    {visibleColumns.customers.totalPurchases && <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(customer.total_purchases)}</td>}
                    {visibleColumns.customers.lastPurchase && <td className="px-4 py-3 text-sm text-gray-600">{customer.last_purchase ? formatDate(customer.last_purchase) : 'Nunca'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {filteredData.sales.length > 0 && (filters.reportType === 'all' || filters.reportType === 'sales') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Relatório de Vendas ({filteredData.sales.length})
            </h3>
            <div className="flex items-center space-x-2">
              {Object.entries(visibleColumns.sales).map(([column, visible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumnVisibility('sales', column)}
                  className={`px-2 py-1 text-xs rounded flex items-center ${
                    visible ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span className="ml-1 hidden sm:inline">
                    {column === 'customerName' ? 'Cliente' : 
                     column === 'total' ? 'Total' : 
                     column === 'paymentMethod' ? 'Pagamento' : 
                     column === 'status' ? 'Status' : 
                     column === 'createdAt' ? 'Data' : column}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.sales.customerName && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>}
                  {visibleColumns.sales.total && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>}
                  {visibleColumns.sales.paymentMethod && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>}
                  {visibleColumns.sales.status && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>}
                  {visibleColumns.sales.createdAt && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    {visibleColumns.sales.customerName && <td className="px-4 py-3 text-sm text-gray-900">{sale.customer_name}</td>}
                    {visibleColumns.sales.total && <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(sale.total)}</td>}
                    {visibleColumns.sales.paymentMethod && <td className="px-4 py-3 text-sm text-gray-600">{sale.payment_method}</td>}
                    {visibleColumns.sales.status && <td className="px-4 py-3 text-sm text-gray-600">{sale.status}</td>}
                    {visibleColumns.sales.createdAt && <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.created_at)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {filteredData.financial.length > 0 && (filters.reportType === 'all' || filters.reportType === 'financial') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
              Relatório Financeiro ({filteredData.financial.length})
            </h3>
            <div className="flex items-center space-x-2">
              {Object.entries(visibleColumns.financial).map(([column, visible]) => (
                <button
                  key={column}
                  onClick={() => toggleColumnVisibility('financial', column)}
                  className={`px-2 py-1 text-xs rounded flex items-center ${
                    visible ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span className="ml-1 hidden sm:inline">
                    {column === 'description' ? 'Descrição' : 
                     column === 'type' ? 'Tipo' : 
                     column === 'amount' ? 'Valor' : 
                     column === 'status' ? 'Status' : 
                     column === 'dueDate' ? 'Vencimento' : column}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.financial.description && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>}
                  {visibleColumns.financial.type && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>}
                  {visibleColumns.financial.amount && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>}
                  {visibleColumns.financial.status && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>}
                  {visibleColumns.financial.dueDate && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.financial.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {visibleColumns.financial.description && <td className="px-4 py-3 text-sm text-gray-900">{record.description}</td>}
                    {visibleColumns.financial.type && <td className="px-4 py-3 text-sm text-gray-600">{record.type === 'income' ? 'Receita' : 'Despesa'}</td>}
                    {visibleColumns.financial.amount && <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(record.amount)}</td>}
                    {visibleColumns.financial.status && <td className="px-4 py-3 text-sm text-gray-600">{record.status}</td>}
                    {visibleColumns.financial.dueDate && <td className="px-4 py-3 text-sm text-gray-600">{formatDate(record.due_date)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => !isImporting && setShowImportModal(false)}></div>
            
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Importar Dados do Excel</h3>
                {!isImporting && (
                  <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Dados para Importar</label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as any)}
                    disabled={isImporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="products">Produtos</option>
                    <option value="customers">Clientes</option>
                    <option value="financial">Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo Excel (.xlsx ou .xls)</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {isImporting && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-600">Processando arquivo...</span>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Formato Esperado para {importType === 'products' ? 'Produtos' : importType === 'customers' ? 'Clientes' : 'Financeiro'}:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {importType === 'products' && (
                      <>
                        <li><strong>Obrigatórios:</strong> Nome, Categoria, Preço, Preço de Custo, Estoque, SKU</li>
                        <li><strong>Opcionais:</strong> Descrição, Estoque Mínimo, Fornecedor</li>
                        <li><strong>Exemplo:</strong> Nome | Categoria | Preço | Preço de Custo | Estoque | SKU</li>
                      </>
                    )}
                    {importType === 'customers' && (
                      <>
                        <li><strong>Obrigatórios:</strong> Nome, Email, Telefone, Documento</li>
                        <li><strong>Opcionais:</strong> Endereço, Cidade, Estado, CEP</li>
                        <li><strong>Exemplo:</strong> Nome | Email | Telefone | Documento | Endereço</li>
                      </>
                    )}
                    {importType === 'financial' && (
                      <>
                        <li><strong>Obrigatórios:</strong> Descrição, Tipo (Receita/Despesa), Valor, Categoria</li>
                        <li><strong>Exemplo:</strong> Descrição | Tipo | Valor | Categoria</li>
                        <li><strong>Nota:</strong> Tipo deve ser "Receita" ou "Despesa"</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">⚠️ Importante:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• O arquivo deve estar no formato Excel (.xlsx ou .xls)</li>
                    <li>• A primeira linha deve conter os cabeçalhos das colunas</li>
                    <li>• Campos obrigatórios não podem estar vazios</li>
                    <li>• Valores numéricos devem usar ponto (.) como separador decimal</li>
                    <li>• Emails devem ter formato válido (conter @)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Funcionalidade Premium"
        message="Importação e exportação de dados são funcionalidades premium. Assine para ter acesso completo."
      />
    </div>
  );
};