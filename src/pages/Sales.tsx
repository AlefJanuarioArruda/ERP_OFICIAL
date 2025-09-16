import React, { useState } from 'react';
import { Plus, Search, ShoppingCart, User, Calendar, DollarSign, Package, Trash2, Edit, Crown, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Sales: React.FC = () => {
  const { products, customers, sales, addSale, loading, getVariationsForProduct } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    payment_method: 'pix' as 'pix' | 'boleto' | 'card' | 'cash',
    payment_status: 'paid' as 'pending' | 'paid' | 'overdue',
    due_date: '',
    discount: 0,
    tax: 0
  });

  const [selectedItems, setSelectedItems] = useState<Array<{
    product_id: string | null;
    variation_id?: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    total: number;
  }>>([]);

  // Effect to show limit banner when limit is reached
  React.useEffect(() => {
    if (usageStatus.isLimitReached.sales && !usageStatus.isSubscriptionActive) {
      setShowLimitBanner(true);
    }
  }, [usageStatus.isLimitReached.sales, usageStatus.isSubscriptionActive]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      payment_method: 'pix',
      payment_status: 'paid',
      due_date: '',
      discount: 0,
      tax: 0
    });
    setSelectedItems([]);
    setShowAddForm(false);
    setShowUpgradeModal(false);
  };

  const handleAddSale = () => {
    if (!usageStatus.canAdd.sales) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const addItemToSale = (product: any, variationId?: string) => {
    const variations = getVariationsForProduct(product.id);
    const variation = variationId ? variations.find(v => v.id === variationId) : null;
    
    const itemPrice = variation?.price || product.price;
    const itemCostPrice = variation?.cost_price || product.cost_price;
    const itemName = variation ? `${product.name} - ${variation.variation_name}` : product.name;
    const availableStock = variation ? variation.stock : product.stock;
    
    if (availableStock <= 0) {
      showNotification('error', `${itemName} está sem estoque`);
      return;
    }

    const existingItemIndex = selectedItems.findIndex(item => 
      item.product_id === product.id && item.variation_id === variationId
    );

    if (existingItemIndex >= 0) {
      const existingItem = selectedItems[existingItemIndex];
      if (existingItem.quantity >= availableStock) {
        showNotification('error', `Estoque insuficiente para ${itemName}. Disponível: ${availableStock}`);
        return;
      }
      
      const newQuantity = existingItem.quantity + 1;
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total: newQuantity * itemPrice
      };
      setSelectedItems(updatedItems);
    } else {
      const newItem = {
        product_id: product.id,
        variation_id: variationId || null,
        product_name: itemName,
        quantity: 1,
        unit_price: itemPrice,
        cost_price: itemCostPrice,
        total: itemPrice
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const item = selectedItems[index];
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;

    const variations = getVariationsForProduct(product.id);
    const variation = item.variation_id ? variations.find(v => v.id === item.variation_id) : null;
    const availableStock = variation ? variation.stock : product.stock;

    if (newQuantity > availableStock) {
      showNotification('error', `Estoque insuficiente. Disponível: ${availableStock}`);
      return;
    }

    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      total: newQuantity * item.unit_price
    };
    setSelectedItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const taxAmount = (subtotal * formData.tax) / 100;
    const total = subtotal - discountAmount + taxAmount;
    const totalCost = selectedItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);

    return { subtotal, discountAmount, taxAmount, total, totalCost };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      showNotification('error', 'Adicione pelo menos um produto à venda');
      return;
    }

    const { subtotal, discountAmount, taxAmount, total, totalCost } = calculateTotals();

    const saleData = {
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name || 'Cliente Avulso',
      items: selectedItems,
      total,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      due_date: formData.due_date || undefined,
      total_cost: totalCost
    };

    const { error } = await addSale(saleData);
    
    if (error) {
      showNotification('error', typeof error === 'string' ? error : 'Erro ao registrar venda');
    } else {
      showNotification('success', 'Venda registrada com sucesso!');
      resetForm();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

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
    <div className="space-y-4 sm:space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Limit Message for Sales */}
      {usageStatus.showLimitMessage.sales && showLimitBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-900 text-sm sm:text-base">
                Você atingiu o limite gratuito de 5 registros nesta seção
              </h4>
              <p className="text-xs sm:text-sm text-amber-700">
                Faça upgrade para o plano pago para continuar adicionando.
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm"
              >
                Assinar
              </button>
              <button
                onClick={() => setShowLimitBanner(false)}
                className="p-1.5 sm:p-2 text-amber-600 hover:text-amber-800 transition-colors"
                title="Dispensar"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Minhas Vendas</h1>
          <p className="text-sm sm:text-base text-gray-600">Registre e gerencie suas vendas</p>
        </div>
        <button
          onClick={handleAddSale}
          disabled={!usageStatus.canAdd.sales}
          className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
            usageStatus.canAdd.sales
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </button>
      </div>

      {/* Sales List */}
      {sales.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{sale.customer_name}</p>
                        <p className="text-sm text-gray-500">{sale.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sale.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.status === 'completed' ? 'Concluída' : 
                       sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </span>
                    
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {sale.payment_method.toUpperCase()}
                    </span>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sale.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.payment_status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.payment_status === 'paid' ? 'Pago' : 
                       sale.payment_status === 'pending' ? 'Pendente' : 'Vencido'}
                    </span>
                  </div>

                  {sale.items && sale.items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Itens da venda:</p>
                      <div className="space-y-1">
                        {sale.items.slice(0, 2).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-600 truncate mr-2">{item.product_name}</span>
                            <span className="text-gray-900 font-medium">{item.quantity}x</span>
                          </div>
                        ))}
                        {sale.items.length > 2 && (
                          <p className="text-xs text-gray-500">+{sale.items.length - 2} itens</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{sale.invoice_number}</div>
                          <div className="text-sm text-gray-500">
                            {sale.items?.length || 0} {sale.items?.length === 1 ? 'item' : 'itens'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                      <div className="text-sm text-gray-500">{sale.payment_method.toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(sale.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : sale.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status === 'completed' ? 'Concluída' : 
                         sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        sale.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : sale.payment_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.payment_status === 'paid' ? 'Pago' : 
                         sale.payment_status === 'pending' ? 'Pendente' : 'Vencido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Comece registrando sua primeira venda
          </p>
          <button
            onClick={handleAddSale}
            disabled={!usageStatus.canAdd.sales}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              usageStatus.canAdd.sales
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Primeira Venda
          </button>
        </div>
      )}

      {/* Add Sale Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="inline-block w-full max-w-xs sm:max-w-7xl p-3 sm:p-6 my-4 sm:my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:rounded-2xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Nova Venda</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Registre uma nova venda</p>
                  </div>
                </div>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Customer Selection */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Informações do Cliente</h4>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Cliente (opcional)</label>
                          <select
                            value={formData.customer_id}
                            onChange={(e) => {
                              const selectedCustomer = customers.find(c => c.id === e.target.value);
                              setFormData({
                                ...formData,
                                customer_id: e.target.value,
                                customer_name: selectedCustomer?.name || ''
                              });
                            }}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Cliente Avulso</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nome para a Venda</label>
                          <input
                            type="text"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nome do cliente ou 'Cliente Avulso'"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Forma de Pagamento</label>
                            <select
                              value={formData.payment_method}
                              onChange={(e) => setFormData({...formData, payment_method: e.target.value as any})}
                              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="pix">PIX</option>
                              <option value="card">Cartão</option>
                              <option value="cash">Dinheiro</option>
                              <option value="boleto">Boleto</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status do Pagamento</label>
                            <select
                              value={formData.payment_status}
                              onChange={(e) => setFormData({...formData, payment_status: e.target.value as any})}
                              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="paid">Pago</option>
                              <option value="pending">Pendente</option>
                              <option value="overdue">Vencido</option>
                            </select>
                          </div>
                        </div>

                        {formData.payment_status !== 'paid' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Data de Vencimento</label>
                            <input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Desconto (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.discount}
                              onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Taxa (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.tax}
                              onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Selection */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border-2 border-green-200 shadow-sm">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                      Produtos Disponíveis
                    </h4>
                    
                    <div className="mb-3 sm:mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar produtos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2 sm:space-y-3">
                      {filteredProducts.map((product) => {
                        const variations = getVariationsForProduct(product.id);
                        const hasVariations = variations.length > 0;
                        
                        return (
                          <div key={product.id} className="bg-white rounded-lg sm:rounded-xl border-2 border-green-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="p-3 sm:p-4">
                              <div className="flex items-center justify-between mb-2 sm:mb-4">
                                <div className="min-w-0 flex-1 mr-3">
                                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                    <p className="text-xs sm:text-sm text-gray-600">R$ {product.price.toFixed(2)}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm text-gray-500">Estoque: {product.stock}</span>
                                      {product.stock <= product.min_stock && (
                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                          Baixo
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">SKU: {product.sku} | {product.category}</p>
                                </div>
                                
                                {!hasVariations && (
                                  <button
                                    type="button"
                                    onClick={() => addItemToSale(product)}
                                    disabled={product.stock <= 0}
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                                      product.stock > 0
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Adicionar
                                  </button>
                                )}
                              </div>

                              {/* Variations */}
                              {hasVariations && (
                                <div className="border-t border-green-200 pt-3 sm:pt-4">
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Variações disponíveis:</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {variations.map((variation) => (
                                      <div key={variation.id} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="min-w-0 flex-1 mr-2">
                                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{variation.variation_name}</p>
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                            <span className="text-xs text-gray-600">
                                              R$ {(variation.price || product.price).toFixed(2)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              Estoque: {variation.stock}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => addItemToSale(product, variation.id)}
                                          disabled={variation.stock <= 0}
                                          className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                                            variation.stock > 0
                                              ? 'bg-green-600 text-white hover:bg-green-700'
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          +
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {filteredProducts.length === 0 && (
                        <div className="text-center py-6 sm:py-8 text-gray-500">
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                          <p className="text-sm sm:text-base">Nenhum produto encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Items */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Itens da Venda ({selectedItems.length})
                      </h4>
                      
                      <div className="bg-blue-50 rounded-lg sm:rounded-xl border-2 border-blue-200 p-4 sm:p-6">
                        {selectedItems.length > 0 ? (
                          <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="bg-white rounded-lg border border-blue-200 p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                  <div className="min-w-0 flex-1 mr-2">
                                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product_name}</p>
                                    <p className="text-xs sm:text-sm text-gray-600">R$ {item.unit_price.toFixed(2)} cada</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                      className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors text-sm sm:text-base"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                      className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors text-sm sm:text-base"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-blue-600 text-sm sm:text-base">{formatCurrency(item.total)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 sm:py-8 text-gray-500">
                            <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                            <p className="text-sm sm:text-base">Nenhum item selecionado</p>
                            <p className="text-xs sm:text-sm">Clique em "Adicionar" nos produtos ao lado</p>
                          </div>
                        )}

                        {/* Totals */}
                        {selectedItems.length > 0 && (
                          <div className="border-t border-blue-200 pt-3 sm:pt-4 mt-3 sm:mt-4 space-y-2">
                            <div className="flex justify-between text-sm sm:text-base">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                              <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-gray-600">Desconto ({formData.discount}%):</span>
                                <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                              </div>
                            )}
                            {taxAmount > 0 && (
                              <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-gray-600">Taxa ({formData.tax}%):</span>
                                <span className="font-medium text-blue-600">+{formatCurrency(taxAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base sm:text-lg font-bold border-t border-blue-200 pt-2">
                              <span className="text-gray-900">Total:</span>
                              <span className="text-blue-600">{formatCurrency(total)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Finalizar Venda
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Você atingiu o limite gratuito de 5 registros nesta seção"
        message="Faça upgrade para o plano pago para continuar adicionando."
      />
    </div>
  );
};