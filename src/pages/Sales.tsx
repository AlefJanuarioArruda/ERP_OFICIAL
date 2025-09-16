import React, { useState } from 'react';
import { Plus, Search, ShoppingCart, FileText, CreditCard, Clock, CheckCircle, XCircle, User, Crown, X, Package, AlertTriangle, Minus } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Sales: React.FC = () => {
  const { sales, customers, products, addSale, loading } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number
    cost_price: number
    total: number
    available_stock: number
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card' | 'cash'>('pix');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  // Utility function to get stock status
  const getStockStatus = (stock: number, minStock: number = 5) => {
    if (stock === 0) {
      return {
        label: 'Sem Estoque',
        color: 'bg-red-100 text-red-800'
      };
    } else if (stock <= minStock) {
      return {
        label: 'Estoque Baixo',
        color: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        label: 'Em Estoque',
        color: 'bg-green-100 text-green-800'
      };
    }
  };

  // Effect to show limit banner when limit is reached
  React.useEffect(() => {
    if (usageStatus.isLimitReached.sales && !usageStatus.isSubscriptionActive) {
      setShowLimitBanner(true);
    }
  }, [usageStatus.isLimitReached.sales, usageStatus.isSubscriptionActive]);

  const filteredSales = sales.filter(sale =>
    sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const addItemToSale = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      showNotification('error', 'Produto não encontrado');
      return;
    }

    if (product.stock <= 0) {
      showNotification('error', `${product.name} está sem estoque`);
      return;
    }

    const existingItem = selectedItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showNotification('error', `Estoque máximo para ${product.name} atingido (${product.stock} unidades)`);
        return;
      }
      
      setSelectedItems(selectedItems.map(item =>
        item.product_id === productId
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * item.unit_price 
            }
          : item
      ));
    } else {
      const newItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        cost_price: product.cost_price,
        total: product.price,
        available_stock: product.stock
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const removeItemFromSale = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromSale(productId);
      return;
    }

    setSelectedItems(selectedItems.map(item => {
      if (item.product_id === productId) {
        const product = products.find(p => p.id === productId);
        const maxQuantity = product ? product.stock : item.available_stock;
        
        if (quantity > maxQuantity) {
          showNotification('error', `Estoque máximo para ${item.product_name}: ${maxQuantity} unidades`);
          return item;
        }
        
        const newQuantity = Math.min(quantity, maxQuantity);
        return { 
          ...item, 
          quantity: newQuantity, 
          total: newQuantity * item.unit_price 
        };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    
    if (discountType === 'percentage') {
      return (subtotal * discountPercentage) / 100;
    } else {
      return discountAmount;
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  };

  const calculateTotalCost = () => {
    return selectedItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
  };

  const resetForm = () => {
    setSelectedCustomer('');
    setCustomerSearchTerm('');
    setSelectedItems([]);
    setPaymentMethod('pix');
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setDiscountType('percentage');
    setShowAddForm(false);
    setShowCustomerDropdown(false);
    setShowUpgradeModal(false);
  };

  const handleAddSale = () => {
    if (!usageStatus.canAdd.sales) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
  };

  const handleCustomerSelect = (customerId: string, customerName: string) => {
    setSelectedCustomer(customerId);
    setCustomerSearchTerm(customerName);
    setShowCustomerDropdown(false);
  };

  const handleDirectSale = () => {
    setSelectedCustomer('direct');
    setCustomerSearchTerm('Venda Direta (sem cliente)');
    setShowCustomerDropdown(false);
  };

  const validateSaleItems = () => {
    for (const item of selectedItems) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        showNotification('error', `Produto ${item.product_name} não encontrado`);
        return false;
      }
      
      if (product.stock < item.quantity) {
        showNotification('error', `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      showNotification('error', 'Adicione pelo menos um produto à venda');
      return;
    }

    // Validar estoque antes de prosseguir
    if (!validateSaleItems()) {
      return;
    }

    let customerData = {
      customer_id: null as string | null,
      customer_name: 'Venda Direta'
    };

    if (selectedCustomer && selectedCustomer !== 'direct') {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        customerData = {
          customer_id: selectedCustomer,
          customer_name: customer.name
        };
      }
    }

    const total = calculateTotal();
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const totalCost = calculateTotalCost();
    
    const saleData = {
      ...customerData,
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      })),
      total,
      subtotal,
      discount,
      tax: 0,
      payment_method: paymentMethod,
      payment_status: 'paid' as const,
      due_date: new Date().toISOString(),
      total_cost: totalCost // Adicionar custo total para controle de despesas
    };

    console.log('Iniciando venda com dados:', saleData);
    
    const result = await addSale(saleData);
    
    if (result?.error) {
      showNotification('error', result.error);
    } else {
      showNotification('success', 'Venda finalizada com sucesso!');
      resetForm();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      pix: 'PIX',
      boleto: 'Boleto',
      card: 'Cartão',
      cash: 'Dinheiro'
    };
    return methods[method as keyof typeof methods] || method;
  };

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
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Limit Message for Sales */}
      {usageStatus.showLimitMessage.sales && showLimitBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900">
                Você atingiu o limite gratuito de 5 registros nesta seção
              </h4>
              <p className="text-sm text-amber-700">
                Faça upgrade para o plano pago para continuar adicionando.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Assinar Agora
            </button>
            <button
              onClick={() => setShowLimitBanner(false)}
              className="p-2 text-amber-600 hover:text-amber-800 transition-colors"
              title="Dispensar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Vendas</h1>
          <p className="text-gray-600">Gerencie suas vendas e controle de estoque automaticamente</p>
        </div>
        <button
          onClick={handleAddSale}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar vendas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Sales List */}
      {filteredSales.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
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
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{sale.invoice_number}</div>
                          <div className="text-sm text-gray-500">{sale.items?.length || 0} item(s)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {sale.customer_id ? (
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 mr-2 text-gray-400" />
                        )}
                        <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(sale.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{getPaymentMethodLabel(sale.payment_method)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(sale.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{sale.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
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
              onClick={handleAddSale}
              disabled={!usageStatus.canAdd.sales}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                usageStatus.canAdd.sales
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </button>
          )}
        </div>
      )}

      {/* Add Sale Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="inline-block w-full max-w-5xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Nova Venda</h3>
                      <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Customer Selection */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Cliente
                          </h4>
                          
                          <div className="relative">
                            <input
                              type="text"
                              value={customerSearchTerm}
                              onChange={(e) => {
                                setCustomerSearchTerm(e.target.value);
                                setShowCustomerDropdown(true);
                                if (!e.target.value) {
                                  setSelectedCustomer('');
                                }
                              }}
                              onFocus={() => setShowCustomerDropdown(true)}
                              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                              placeholder="Buscar cliente ou venda direta"
                            />
                            
                            {showCustomerDropdown && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {/* Direct Sale Option */}
                                <button
                                  type="button"
                                  onClick={handleDirectSale}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-blue-100 flex items-center"
                                >
                                  <ShoppingCart className="w-4 h-4 mr-3 text-blue-600" />
                                  <div>
                                    <div className="font-medium text-gray-900">Venda Direta</div>
                                    <div className="text-sm text-gray-500">Sem vínculo com cliente</div>
                                  </div>
                                </button>
                                
                                {/* Customer List */}
                                {filteredCustomers.length > 0 && (
                                  <>
                                    <div className="px-4 py-2 bg-blue-50 text-xs font-medium text-blue-600 uppercase">
                                      Clientes Cadastrados
                                    </div>
                                    {filteredCustomers.map((customer) => (
                                      <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() => handleCustomerSelect(customer.id, customer.name)}
                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center"
                                      >
                                        <User className="w-4 h-4 mr-3 text-gray-400" />
                                        <div>
                                          <div className="font-medium text-gray-900">{customer.name}</div>
                                          <div className="text-sm text-gray-500">{customer.email}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Payment Method */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-blue-900 mb-2">Forma de Pagamento</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                              <option value="pix">PIX</option>
                              <option value="card">Cartão</option>
                              <option value="boleto">Boleto</option>
                              <option value="cash">Dinheiro</option>
                            </select>
                          </div>

                          {/* Discount Section */}
                          <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
                            <h5 className="text-sm font-medium text-blue-900 mb-3">Desconto (Opcional)</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                  value={discountType}
                                  onChange={(e) => {
                                    setDiscountType(e.target.value as 'percentage' | 'fixed');
                                    setDiscountPercentage(0);
                                    setDiscountAmount(0);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  <option value="percentage">%</option>
                                  <option value="fixed">R$</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={discountType === 'percentage' ? "100" : undefined}
                                  step={discountType === 'percentage' ? "0.1" : "0.01"}
                                  value={discountType === 'percentage' ? 
                                    (discountPercentage === 0 ? '' : discountPercentage) : 
                                    (discountAmount === 0 ? '' : discountAmount)
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                      if (discountType === 'percentage') {
                                        setDiscountPercentage(0);
                                      } else {
                                        setDiscountAmount(0);
                                      }
                                    } else {
                                      const numValue = parseFloat(value);
                                      if (!isNaN(numValue)) {
                                        if (discountType === 'percentage') {
                                          setDiscountPercentage(Math.min(100, Math.max(0, numValue)));
                                        } else {
                                          setDiscountAmount(Math.max(0, numValue));
                                        }
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            
                            {(discountPercentage > 0 || discountAmount > 0) && (
                              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-sm text-green-800">
                                  Desconto: <strong>{formatCurrency(calculateDiscount())}</strong>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Column - Products Selection */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <Package className="w-5 h-5 mr-2" />
                            Produtos
                          </h4>
                          
                          {/* Product Search */}
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                              placeholder="Buscar produtos..."
                            />
                          </div>

                          {/* Products List */}
                          {filteredProductsForSale.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                              {filteredProductsForSale.map((product) => {
                                const stockStatus = getStockStatus(product.stock, product.min_stock);
                                const variations = getVariationsForProduct(product.id);
                                const isExpanded = expandedProducts.has(product.id);
                                
                                return (
                                  <div key={product.id} className="bg-white rounded-lg border border-green-200 overflow-hidden">
                                    {/* Main Product */}
                                    <div className="p-4">
                                      <div className="flex items-center space-x-3">
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                          {product.image_url ? (
                                            <img
                                              src={product.image_url}
                                              alt={product.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                              <Package className="w-8 h-8 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Product Info */}
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <h5 className="font-semibold text-gray-900">{product.name}</h5>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                              {stockStatus.label}
                                            </span>
                                          </div>
                                          <p className="text-sm text-green-600 font-medium">{formatCurrency(product.price)}</p>
                                          <p className="text-xs text-gray-500">
                                            SKU: {product.sku} • Estoque: {product.stock}
                                          </p>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center space-x-2">
                                          {variations.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => toggleProductExpansion(product.id)}
                                              className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                              title={`${variations.length} variações`}
                                            >
                                              <Grid className="w-4 h-4" />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => addItemToSale(product.id)}
                                            disabled={product.stock === 0}
                                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                              product.stock === 0
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                          >
                                            {product.stock === 0 ? 'Sem Estoque' : 'Adicionar'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Variations */}
                                    {variations.length > 0 && isExpanded && (
                                      <div className="bg-purple-50 border-t border-purple-200 p-4">
                                        <h6 className="text-sm font-medium text-purple-900 mb-3 flex items-center">
                                          <Grid className="w-4 h-4 mr-2" />
                                          Variações Disponíveis
                                        </h6>
                                        <div className="grid grid-cols-1 gap-2">
                                          {variations.map((variation) => (
                                            <div key={variation.id} className="bg-white rounded-lg p-3 border border-purple-200">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                                    {variation.image_url ? (
                                                      <img
                                                        src={variation.image_url}
                                                        alt={variation.variation_name}
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ) : (
                                                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                                        <Grid className="w-4 h-4 text-purple-500" />
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div>
                                                    <p className="text-sm font-medium text-gray-900">{variation.variation_name}</p>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                      {variation.color && (
                                                        <span className="flex items-center">
                                                          <Palette className="w-3 h-3 mr-1" />
                                                          {variation.color}
                                                        </span>
                                                      )}
                                                      {variation.size && (
                                                        <span className="flex items-center">
                                                          <Ruler className="w-3 h-3 mr-1" />
                                                          {variation.size}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-sm text-purple-600 font-medium">
                                                      {variation.price ? formatCurrency(variation.price) : formatCurrency(product.price)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Estoque: {variation.stock}</p>
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => addItemToSale(`${product.id}-${variation.id}`)}
                                                  disabled={variation.stock === 0}
                                                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                                    variation.stock === 0
                                                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                      : 'bg-purple-600 text-white hover:bg-purple-700'
                                                  }`}
                                                >
                                                  {variation.stock === 0 ? 'Sem Estoque' : 'Adicionar'}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-lg border border-green-200">
                              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-600">Nenhum produto encontrado</p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Shopping Cart */}
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                          <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Carrinho ({selectedItems.length})
                          </h4>
                          
                          {selectedItems.length > 0 ? (
                            <div className="space-y-3 mb-6">
                              {selectedItems.map((item, index) => (
                                <div key={item.product_id} className="bg-white rounded-lg p-4 border border-amber-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                                      {item.is_variation && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                          <Grid className="w-3 h-3 mr-1" />
                                          Variação
                                        </span>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatCurrency(item.unit_price)} × {item.quantity}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-green-600">{formatCurrency(item.total)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => updateItemQuantity(item.product_id!, item.quantity - 1)}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateItemQuantity(item.product_id!, item.quantity + 1)}
                                        disabled={item.quantity >= item.available_stock}
                                        className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 flex items-center justify-center text-white"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeItemFromSale(item.product_id!)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-lg border border-amber-200 mb-6">
                              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-600">Carrinho vazio</p>
                              <p className="text-sm text-gray-500">Adicione produtos para começar</p>
                            </div>
                          )}
                          
                          {/* Totals */}
                          <div className="bg-white rounded-lg p-4 border border-amber-200">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Subtotal:</span>
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(calculateSubtotal())}</span>
                              </div>
                              
                              {(discountPercentage > 0 || discountAmount > 0) && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Desconto {discountType === 'percentage' ? `(${discountPercentage}%)` : ''}:
                                  </span>
                                  <span className="text-sm font-medium text-red-600">
                                    -{formatCurrency(calculateDiscount())}
                                  </span>
                                </div>
                              )}
                              
                              <div className="border-t border-amber-300 pt-2">
                                <div className="flex justify-between items-center text-lg font-bold">
                                  <span className="text-amber-900">Total:</span>
                                  <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-1">
                                  <span className="text-gray-600">Lucro Estimado:</span>
                                  <span className={`font-medium ${
                                    (calculateTotal() - calculateTotalCost()) > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(calculateTotal() - calculateTotalCost())}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={selectedItems.length === 0}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                        >
                          Finalizar Venda ({formatCurrency(calculateTotal())})
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