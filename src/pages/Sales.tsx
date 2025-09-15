import React, { useState } from 'react';
import { Plus, Search, ShoppingCart, FileText, CreditCard, Clock, CheckCircle, XCircle, User, Crown, X, Package } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Sales: React.FC = () => {
  const { sales, customers, products, addSale, loading, getVariationsForProduct } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number
    total: number
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card' | 'cash'>('pix');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

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

 // Adicionar produto simples
const addItemToSale = (productId: string) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = selectedItems.find(item => item.product_id === productId);

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      alert("Estoque máximo atingido!");
      return; // 🚨 Sai da função sem alterar nada
    }

    setSelectedItems(selectedItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
        : item
    ));
  } else {
    if (product.stock <= 0) {
      alert("Produto sem estoque!");
      return;
    }

    const newItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      total: product.price
    };
    setSelectedItems([...selectedItems, newItem]);
  }
};

// Adicionar variação
const addVariationToSale = (variation: any) => {
  const product = products.find(p => p.id === variation.product_id);
  if (!product) return;

  const variationKey = `${variation.product_id}-${variation.id}`;
  const existingItem = selectedItems.find(item => item.product_id === variationKey);

  if (existingItem) {
    if (existingItem.quantity >= variation.stock) {
      alert("Estoque máximo atingido!");
      return; // 🚨 Sai da função sem alterar nada
    }

    setSelectedItems(selectedItems.map(item =>
      item.product_id === variationKey
        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
        : item
    ));
  } else {
    if (variation.stock <= 0) {
      alert("Variação sem estoque!");
      return;
    }

    const newItem = {
      product_id: variationKey,
      product_name: `${product.name} - ${variation.variation_name}`,
      quantity: 1,
      unit_price: variation.price || product.price,
      total: variation.price || product.price
    };
    setSelectedItems([...selectedItems, newItem]);
  }
};

// Atualizar quantidade manualmente (input)
const updateItemQuantity = (productId: string, quantity: number) => {
  if (!quantity || quantity < 1) quantity = 1;

  setSelectedItems(selectedItems.map(item => {
    if (item.product_id === productId) {
      const [baseId, variationId] = productId.split("-");
      let stock = 0;

      if (variationId) {
        const variation = products
          .find(p => p.id === baseId)
          ?.variations?.find((v: any) => v.id === variationId);
        stock = variation?.stock || 0;
      } else {
        const product = products.find(p => p.id === productId);
        stock = product?.stock || 0;
      }

      if (quantity > stock) {
        alert("Quantidade não pode ultrapassar o estoque!");
        return { ...item, quantity: item.quantity, total: item.quantity * item.unit_price }; 
        // 🚨 Mantém a quantidade atual
      }

      return { ...item, quantity, total: quantity * item.unit_price };
    }
    return item;
  }));
};

  const calculateTotal = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    let discount = 0;
    
    if (discountType === 'percentage') {
      discount = (subtotal * discountPercentage) / 100;
    } else {
      discount = discountAmount;
    }
    
    return Math.max(0, subtotal - discount);
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

  const handleDelete = async (saleId: string) => {
    if (usageStatus.isLimitReached.sales && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }

    // Note: deleteSale function needs to be implemented in useSupabaseData
    // For now, we'll show a message that this feature is coming soon
    alert('Funcionalidade de exclusão de vendas em desenvolvimento');
    setShowDeleteConfirm(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) return;

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
    
    const saleData = {
      ...customerData,
      items: selectedItems,
      total,
      subtotal,
      discount,
      tax: 0,
      payment_method: paymentMethod,
      payment_status: 'paid' as const,
      due_date: new Date().toISOString()
    };

    await addSale(saleData);
    
    resetForm();
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
          <p className="text-gray-600">Gerencie suas vendas e faturas pessoais</p>
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
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Nova Venda</h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-5 h-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Selection */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Buscar cliente ou selecionar venda direta"
                      />
                      
                      {showCustomerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {/* Direct Sale Option */}
                          <button
                            type="button"
                            onClick={handleDirectSale}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center"
                          >
                            <ShoppingCart className="w-4 h-4 mr-3 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">Venda Direta (sem cliente)</div>
                              <div className="text-sm text-gray-500">Venda anônima sem vínculo com cliente</div>
                            </div>
                          </button>
                          
                          {/* Customer List */}
                          {filteredCustomers.length > 0 && (
                            <>
                              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                Clientes Cadastrados
                              </div>
                              {filteredCustomers.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleCustomerSelect(customer.id, customer.name)}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
                                >
                                  <User className="w-4 h-4 mr-3 text-gray-400" />
                                  <div>
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-sm text-gray-500">{customer.email} • {customer.document}</div>
                                  </div>
                                </button>
                              ))}
                            </>
                          )}
                          
                          {filteredCustomers.length === 0 && customerSearchTerm && customerSearchTerm !== 'Venda Direta (sem cliente)' && (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              Nenhum cliente encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
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
                </div>

                {/* Discount Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Desconto (Opcional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Desconto</label>
                      <select
                        value={discountType}
                        onChange={(e) => {
                          setDiscountType(e.target.value as 'percentage' | 'fixed');
                          setDiscountPercentage(0);
                          setDiscountAmount(0);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="percentage">Porcentagem (%)</option>
                        <option value="fixed">Valor Fixo (R$)</option>
                      </select>
                    </div>
                    
                    {discountType === 'percentage' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={discountPercentage === 0 ? '' : discountPercentage}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setDiscountPercentage(0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                setDiscountPercentage(Math.min(100, Math.max(0, numValue)));
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountAmount === 0 ? '' : discountAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setDiscountAmount(0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                setDiscountAmount(Math.max(0, numValue));
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0,00"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-end">
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Desconto</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                          {formatCurrency(calculateDiscount())}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                  {products.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-lg">
                      {products.map((product) => {
                        const variations = getVariationsForProduct(product.id);
                        
                        return (
                          <div key={product.id} className="mb-4">
                            {/* Main Product */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                              <div className="flex items-center space-x-3">
                                {/* Product Image */}
                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                     className="w-full h-full object-cover"
                                    />
                                  ) : (
                                   <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                                <p className="text-xs text-gray-500">Estoque: {product.stock}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addItemToSale(product.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                disabled={product.stock === 0}
                              >
                                Adicionar
                              </button>
                            </div>
                            
                            {/* Product Variations */}
                            {variations.length > 0 && (
                              <div className="ml-4 space-y-2">
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Variações:</p>
                                {variations.map((variation) => (
                                  <div key={variation.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <div className="flex items-center space-x-2">
                                      {/* Variation Image */}
                                      <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                        {variation.image_url ? (
                                          <img
                                            src={variation.image_url}
                                            alt={variation.variation_name}
                                           className="w-full h-full object-cover"
                                          />
                                        ) : (
                                         <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                            <Package className="w-3 h-3 text-blue-400" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Variation Info */}
                                      <div>
                                      <p className="text-sm font-medium text-gray-900">{variation.variation_name}</p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                                        {variation.color && <span>Cor: {variation.color}</span>}
                                        {variation.size && <span>Tamanho: {variation.size}</span>}
                                        <span>Preço: {formatCurrency(variation.price || product.price)}</span>
                                        <span>Estoque: {variation.stock}</span>
                                      </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addVariationToSale(variation)}
                                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                      disabled={variation.stock === 0}
                                    >
                                      Adicionar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h4>
                      <p className="text-gray-600 mb-6">
                        Você precisa cadastrar produtos antes de fazer vendas
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          window.location.href = '/products';
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ir para Produtos
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Itens Selecionados</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} cada</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.product_id!, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.product_id!, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                            <span className="text-sm font-medium text-green-600 ml-2">
                              {formatCurrency(item.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItemFromSale(item.product_id!)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
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
                        
                        <div className="border-t border-gray-300 pt-2">
                          <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total:</span>
                            <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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