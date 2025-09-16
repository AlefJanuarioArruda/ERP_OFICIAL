import React, { useState, useRef } from 'react';
import {
  Plus, Search, ShoppingCart, DollarSign, Calendar, Edit, Trash2, CheckCircle, AlertCircle, X, Package, Users, Grid,
  ArrowRight, User, Tag, Percent, Receipt, Clock, CreditCard, Banknote, Barcode,
  ChevronDown, ChevronUp, Minus, Crown, Eye, Filter, Star, Palette, Ruler
} from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UsageLimitBanner } from '../components/UsageLimitBanner';
import { UpgradeModal } from '../components/UpgradeModal';

// Define a local type for sale items that includes cost_price for internal calculations
interface SaleItemForProcessing {
  product_id: string; // Can be composite for variations (e.g., "parentID-variationID")
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost_price: number; // Added for internal calculation
}

export const Sales: React.FC = () => {
  const {
    sales,
    products,
    customers,
    addSale,
    deleteSale,
    getVariationsForProduct,
    loading,
  } = useSupabaseData();
  const usageStatus = useUsageLimits();
  
  // Existing sales management state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'pix' | 'boleto' | 'card' | 'cash'>('all');
  const [editingSale, setEditingSale] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(true);

  // New Sale Modal State
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [currentSaleItems, setCurrentSaleItems] = useState<SaleItemForProcessing[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card' | 'cash'>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'overdue'>('paid');
  const [dueDate, setDueDate] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedProductToView, setSelectedProductToView] = useState<any>(null);

  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to show limit banner when limit is reached
  React.useEffect(() => {
    if (usageStatus.isLimitReached.sales && !usageStatus.isSubscriptionActive) {
      setShowLimitBanner(true);
    }
  }, [usageStatus.isLimitReached.sales, usageStatus.isSubscriptionActive]);

  const resetNewSaleForm = () => {
    setShowNewSaleModal(false);
    setCurrentSaleItems([]);
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setProductSearchTerm('');
    setDiscount(0);
    setTax(0);
    setPaymentMethod('pix');
    setPaymentStatus('paid');
    setDueDate('');
    setEditingSale(null);
    setSelectedProductToView(null);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleNewSale = () => {
    if (!usageStatus.canAdd.sales) {
      setShowUpgradeModal(true);
      return;
    }
    setShowNewSaleModal(true);
  };

  const addItemToSale = (product: any, variation?: any) => {
    try {
      // Defensive checks
      if (!product || !product.id) {
        console.error('Product is undefined or missing ID');
        showNotification('error', 'Erro: produto inválido');
        return;
      }

      if (variation && !variation.id) {
        console.error('Variation is undefined or missing ID');
        showNotification('error', 'Erro: variação inválida');
        return;
      }

      // Ensure currentSaleItems is always an array
      const currentItems = Array.isArray(currentSaleItems) ? currentSaleItems : [];

      const isVariation = !!variation;
      const itemId = isVariation ? `${product.id}-${variation.id}` : product.id;
      const itemName = isVariation ? `${product.name} - ${variation.variation_name}` : product.name;
      const itemPrice = isVariation && variation.price !== undefined && variation.price !== null
        ? variation.price
        : product.price;
      const itemCostPrice = product.cost_price;
      const availableStock = isVariation ? variation.stock : product.stock;

      // Check stock availability
      if (availableStock <= 0) {
        showNotification('error', `${itemName} está sem estoque`);
        return;
      }

      const existingItemIndex = currentItems.findIndex(item => item.product_id === itemId);

      if (existingItemIndex > -1) {
        // Update quantity if item already exists
        const existingItem = currentItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        
        if (newQuantity > availableStock) {
          showNotification('error', `Estoque insuficiente para ${itemName}. Disponível: ${availableStock}`);
          return;
        }

        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity = newQuantity;
        updatedItems[existingItemIndex].total = newQuantity * updatedItems[existingItemIndex].unit_price;
        setCurrentSaleItems(updatedItems);
      } else {
        // Add new item
        const newItem: SaleItemForProcessing = {
          product_id: itemId,
          product_name: itemName,
          quantity: 1,
          unit_price: itemPrice,
          total: itemPrice,
          cost_price: itemCostPrice,
        };

        setCurrentSaleItems([...currentItems, newItem]);
      }

      showNotification('success', `${itemName} adicionado à venda!`);
      setSelectedProductToView(null);
      setProductSearchTerm('');
    } catch (error) {
      console.error('Erro ao adicionar item à venda:', error);
      showNotification('error', 'Erro inesperado ao adicionar item');
    }
  };

  const handleUpdateItemQuantity = (index: number, action: 'increase' | 'decrease') => {
    const updatedItems = [...currentSaleItems];
    const item = updatedItems[index];
    
    if (action === 'increase') {
      // Check stock availability for increase
      const isVariation = item.product_id.includes('-');
      let availableStock = 0;
      
      if (isVariation) {
        const [productId, variationId] = item.product_id.split('-');
        const variation = getVariationsForProduct(productId).find(v => v.id === variationId);
        availableStock = variation?.stock || 0;
      } else {
        const product = products.find(p => p.id === item.product_id);
        availableStock = product?.stock || 0;
      }
      
      if (item.quantity >= availableStock) {
        showNotification('error', `Estoque insuficiente para ${item.product_name}. Disponível: ${availableStock}`);
        return;
      }
      
      item.quantity += 1;
    } else {
      item.quantity = Math.max(1, item.quantity - 1);
    }
    
    item.total = item.quantity * item.unit_price;
    setCurrentSaleItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...currentSaleItems];
    const removedItem = updatedItems[index];
    updatedItems.splice(index, 1);
    setCurrentSaleItems(updatedItems);
    showNotification('success', `${removedItem.product_name} removido da venda!`);
  };

  const calculateSubtotal = () => {
    return currentSaleItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotalCost = (): number => {
    return currentSaleItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateTaxAmount = () => {
    return ((calculateSubtotal() - calculateDiscountAmount()) * tax) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    return subtotal - discountAmount + taxAmount;
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentSaleItems.length === 0) {
      showNotification('error', 'Adicione pelo menos um item à venda.');
      return;
    }

    const saleData = {
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.name || 'Cliente Avulso',
      items: currentSaleItems,
      total: calculateTotal(),
      subtotal: calculateSubtotal(),
      discount: calculateDiscountAmount(),
      tax: calculateTaxAmount(),
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      due_date: dueDate || new Date().toISOString(),
      total_cost: calculateTotalCost(),
    };

    const result = await addSale(saleData);
    
    if (result?.error) {
      showNotification('error', result.error);
    } else {
      showNotification('success', 'Venda registrada com sucesso!');
      resetNewSaleForm();
    }
  };

  const handleDelete = async (saleId: string) => {
    if (usageStatus.isLimitReached.sales && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const { error } = await deleteSale(saleId);
    
    if (error) {
      showNotification('error', 'Erro ao excluir venda');
    } else {
      showNotification('success', 'Venda excluída com sucesso');
    }
    setShowDeleteConfirm(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto';
      case 'card':
        return 'Cartão';
      case 'cash':
        return 'Dinheiro';
      default:
        return method;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || sale.payment_method === filterPaymentMethod;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  // Filter customers for selection
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Filter products for selection
  const filteredProductsForSelection = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Limit Banner for Non-Subscribers */}
      {!usageStatus.isSubscriptionActive && showLimitBanner && (
        <UsageLimitBanner
          onUpgrade={() => setShowUpgradeModal(true)}
          onDismiss={() => setShowLimitBanner(false)}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success'
            ? 'bg-green-100 border border-green-200 text-green-800'
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Vendas</h1>
          <p className="text-gray-600">
            Gerencie suas vendas e acompanhe o desempenho
            {!usageStatus.isSubscriptionActive && (
              <span className="text-amber-600 font-medium"> (Funcionalidade Premium)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleNewSale}
          disabled={!usageStatus.canAdd.sales}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            usageStatus.canAdd.sales
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar vendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="completed">Concluída</option>
          <option value="cancelled">Cancelada</option>
        </select>

        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os métodos</option>
          <option value="pix">PIX</option>
          <option value="card">Cartão</option>
          <option value="boleto">Boleto</option>
          <option value="cash">Dinheiro</option>
        </select>
      </div>

      {/* Sales List */}
      {filteredSales.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                          <div className="text-sm text-gray-500">{sale.invoice_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sale.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPaymentStatusLabel(sale.payment_status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(sale.id)}
                          disabled={!usageStatus.isSubscriptionActive}
                          className={`p-2 rounded-lg transition-colors ${
                            usageStatus.isSubscriptionActive
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={usageStatus.isSubscriptionActive ? "Excluir venda" : "Disponível apenas na versão paga"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece registrando sua primeira venda'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleNewSale}
              disabled={!usageStatus.canAdd.sales}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                usageStatus.canAdd.sales
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Primeira Venda
            </button>
          )}
        </div>
      )}

      {/* New Sale Modal */}
      {showNewSaleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetNewSaleForm}></div>

            <div className="inline-block w-full max-w-6xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Nova Venda</h3>
                    <p className="text-sm text-gray-600">Adicione produtos e variações ao carrinho</p>
                  </div>
                </div>
                <button onClick={resetNewSaleForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Product Selection */}
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-gray-600" />
                      Selecionar Cliente
                    </h4>
                    <div className="relative" ref={customerDropdownRef}>
                      <input
                        type="text"
                        value={selectedCustomer ? selectedCustomer.name : customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          if (selectedCustomer) setSelectedCustomer(null);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Buscar cliente (opcional)..."
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearchTerm('');
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedCustomer && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                            <p className="text-sm text-blue-700">{selectedCustomer.email}</p>
                          </div>
                          <button
                            onClick={() => setSelectedCustomer(null)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Search and Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-gray-600" />
                      Adicionar Produtos
                    </h4>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Buscar produtos..."
                      />
                    </div>

                    {/* Products List */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredProductsForSelection.length > 0 ? (
                        filteredProductsForSelection.map((product) => {
                          const variations = getVariationsForProduct(product.id);
                          const hasVariations = variations.length > 0;
                          
                          return (
                            <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-3">
                              {/* Main Product */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-12 h-12 object-cover rounded-lg"
                                      />
                                    ) : (
                                      <Package className="w-6 h-6 text-blue-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{product.name}</h5>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span>SKU: {product.sku}</span>
                                      <span>Estoque: {product.stock}</span>
                                      <span className="font-medium text-green-600">{formatCurrency(product.price)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {hasVariations && (
                                    <button
                                      onClick={() => setSelectedProductToView(
                                        selectedProductToView?.id === product.id ? null : product
                                      )}
                                      className="flex items-center px-3 py-1 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                    >
                                      <Grid className="w-4 h-4 mr-1" />
                                      {variations.length} variação(ões)
                                      {selectedProductToView?.id === product.id ? (
                                        <ChevronUp className="w-4 h-4 ml-1" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 ml-1" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => addItemToSale(product)}
                                    disabled={product.stock <= 0}
                                    className={`px-3 py-1 rounded-lg transition-colors ${
                                      product.stock > 0
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Adicionar
                                  </button>
                                </div>
                              </div>

                              {/* Variations */}
                              {selectedProductToView?.id === product.id && hasVariations && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <Grid className="w-4 h-4 mr-2 text-purple-500" />
                                    Variações Disponíveis
                                  </h6>
                                  <div className="grid grid-cols-1 gap-2">
                                    {variations.map((variation) => (
                                      <div key={variation.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center flex-1">
                                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                                            {variation.image_url ? (
                                              <img
                                                src={variation.image_url}
                                                alt={variation.variation_name}
                                                className="w-8 h-8 object-cover rounded-lg"
                                              />
                                            ) : (
                                              <Grid className="w-4 h-4 text-purple-600" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">{variation.variation_name}</p>
                                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                                              {variation.color && (
                                                <div className="flex items-center">
                                                  <Palette className="w-3 h-3 mr-1" />
                                                  {variation.color}
                                                </div>
                                              )}
                                              {variation.size && (
                                                <div className="flex items-center">
                                                  <Ruler className="w-3 h-3 mr-1" />
                                                  {variation.size}
                                                </div>
                                              )}
                                              <span>Estoque: {variation.stock}</span>
                                              <span className="font-medium text-green-600">
                                                {formatCurrency(variation.price || product.price)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => addItemToSale(product, variation)}
                                          disabled={variation.stock <= 0}
                                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                            variation.stock > 0
                                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          Adicionar
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>
                            {productSearchTerm 
                              ? 'Nenhum produto encontrado' 
                              : 'Digite para buscar produtos'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Sale Summary */}
                <div className="space-y-6">
                  {/* Current Sale Items (Cart) */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Receipt className="w-5 h-5 mr-2 text-gray-600" />
                      Carrinho ({currentSaleItems.length} {currentSaleItems.length === 1 ? 'item' : 'itens'})
                    </h4>

                    {currentSaleItems.length > 0 ? (
                      <div className="space-y-3">
                        {currentSaleItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                <span>{formatCurrency(item.unit_price)} × {item.quantity}</span>
                                <span className="font-medium text-green-600">{formatCurrency(item.total)}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(index, 'decrease')}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 py-1 bg-white rounded text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(index, 'increase')}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Sale Totals */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(calculateSubtotal())}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-700">Desconto (%):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={discount}
                              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-right text-sm"
                            />
                          </div>
                          
                          {discount > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span>Desconto:</span>
                              <span>-{formatCurrency(calculateDiscountAmount())}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-700">Imposto (%):</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={tax}
                              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-right text-sm"
                            />
                          </div>
                          
                          {tax > 0 && (
                            <div className="flex justify-between text-sm text-blue-600">
                              <span>Imposto:</span>
                              <span>+{formatCurrency(calculateTaxAmount())}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum item adicionado</p>
                        <p className="text-sm">Busque e adicione produtos à esquerda</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Details */}
                  {currentSaleItems.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                        Detalhes do Pagamento
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pix">PIX</option>
                            <option value="card">Cartão</option>
                            <option value="boleto">Boleto</option>
                            <option value="cash">Dinheiro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status do Pagamento</label>
                          <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="paid">Pago</option>
                            <option value="pending">Pendente</option>
                            <option value="overdue">Vencido</option>
                          </select>
                        </div>
                        
                        {paymentStatus !== 'paid' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={resetNewSaleForm}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSale}
                  disabled={currentSaleItems.length === 0}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Venda ({formatCurrency(calculateTotal())})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(null)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir esta venda? Todas as informações serão perdidas permanentemente.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir Venda
                </button>
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
        message="O registro de vendas é uma funcionalidade premium. Assine para ter acesso completo."
      />
    </div>
  );
};