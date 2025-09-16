import React, { useState } from 'react';
import { Plus, Search, ShoppingCart, FileText, CreditCard, Clock, CheckCircle, XCircle, User, Crown, X, Package, AlertTriangle, Minus, Trash2, Grid, Palette, Ruler, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Sales: React.FC = () => {
  const { sales, customers, products, getVariationsForProduct, addSale, loading } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showLimitBanner, setShowLimitBanner] = useState(true);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [expandedProducts, setExpandedProducts] = useState(new Set<string>());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{
    id: string // Unique identifier for the cart item
    product_id: string | null
    variation_id?: string | null
    product_name: string
    variation_name?: string
    quantity: number
    unit_price: number
    cost_price: number
    total: number
    available_stock: number
    is_variation?: boolean
    color?: string
    size?: string
    image_url?: string
  }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card' | 'cash'>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'overdue'>('paid');
  const [dueDate, setDueDate] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  // Utility function to get stock status
  const getStockStatus = (stock: number, minStock: number = 5) => {
    if (stock === 0) {
      return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= minStock) {
      return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'Em Estoque', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

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

  const filteredProductsForSale = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const addItemToSale = (productId: string, variationId?: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return showNotification('error', 'Produto não encontrado');

      let itemData;
      let uniqueId;

      if (variationId) {
        const variation = getVariationsForProduct(productId).find(v => v.id === variationId);
        if (!variation) return showNotification('error', 'Variação não encontrada');
        if (variation.stock <= 0) return showNotification('error', `Variação ${variation.variation_name} está sem estoque`);

        uniqueId = `${productId}-${variationId}`;
        const existingItem = selectedItems.find(item => item.id === uniqueId);
        if (existingItem) {
          if (existingItem.quantity >= variation.stock) return showNotification('error', `Estoque máximo para ${variation.variation_name} atingido`);
          setSelectedItems(selectedItems.map(item => item.id === uniqueId ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price } : item));
          return;
        }
        itemData = { id: uniqueId, product_id: productId, variation_id: variationId, product_name: product.name, variation_name: variation.variation_name, quantity: 1, unit_price: variation.price || product.price, cost_price: product.cost_price, total: variation.price || product.price, available_stock: variation.stock, is_variation: true, color: variation.color, size: variation.size, image_url: variation.image_url || product.image_url };
      } else {
        if (product.stock <= 0) return showNotification('error', `${product.name} está sem estoque`);
        uniqueId = productId;
        const existingItem = selectedItems.find(item => item.id === uniqueId);
        if (existingItem) {
          if (existingItem.quantity >= product.stock) return showNotification('error', `Estoque máximo para ${product.name} atingido`);
          setSelectedItems(selectedItems.map(item => item.id === uniqueId ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price } : item));
          return;
        }
        itemData = { id: uniqueId, product_id: productId, variation_id: null, product_name: product.name, quantity: 1, unit_price: product.price, cost_price: product.cost_price, total: product.price, available_stock: product.stock, is_variation: false, image_url: product.image_url };
      }
      setSelectedItems([...selectedItems, itemData]);
      showNotification('success', `${itemData.variation_name || itemData.product_name} adicionado ao carrinho`);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      showNotification('error', 'Erro ao adicionar item ao carrinho');
    }
  };

  const removeItemFromSale = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItemFromSale(itemId);
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        if (quantity > item.available_stock) {
          showNotification('error', `Estoque máximo: ${item.available_stock} unidades`);
          return { ...item, quantity: item.available_stock, total: item.available_stock * item.unit_price };
        }
        return { ...item, quantity, total: quantity * item.unit_price };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => selectedItems.reduce((sum, item) => sum + item.total, 0);
  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    const discount = discountType === 'percentage' ? (subtotal * discountPercentage) / 100 : discountAmount;
    return discount > subtotal ? subtotal : discount;
  };
  const calculateTotal = () => Math.max(0, calculateSubtotal() - calculateDiscount());
  const calculateTotalCost = () => selectedItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);

  const resetForm = () => {
    setSelectedCustomer(''); setCustomerSearchTerm(''); setSelectedItems([]);
    setPaymentMethod('pix'); setPaymentStatus('paid'); setDueDate('');
    setDiscountPercentage(0); setDiscountAmount(0); setDiscountType('percentage');
    setShowAddForm(false); setShowCustomerDropdown(false); setShowUpgradeModal(false);
    setExpandedProducts(new Set());
  };

  const handleAddSale = () => {
    if (!usageStatus.canAdd.sales) return setShowUpgradeModal(true);
    setShowAddForm(true);
  };

  const handleCustomerSelect = (customerId: string, customerName: string) => {
    setSelectedCustomer(customerId); setCustomerSearchTerm(customerName); setShowCustomerDropdown(false);
  };

  const handleDirectSale = () => {
    setSelectedCustomer('direct'); setCustomerSearchTerm('Venda Direta (sem cliente)'); setShowCustomerDropdown(false);
  };

  const validateSaleItems = () => {
    for (const item of selectedItems) {
      const checkItem = item.is_variation ? getVariationsForProduct(item.product_id!).find(v => v.id === item.variation_id) : products.find(p => p.id === item.product_id);
      if (!checkItem) { showNotification('error', `Item ${item.product_name} não encontrado.`); return false; }
      if (checkItem.stock < item.quantity) { showNotification('error', `Estoque insuficiente para ${item.product_name}. Disponível: ${checkItem.stock}, Solicitado: ${item.quantity}`); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return showNotification('error', 'Adicione pelo menos um produto à venda');
    if (!validateSaleItems()) return;

    let customerData = { customer_id: null as string | null, customer_name: 'Venda Direta' };
    if (selectedCustomer && selectedCustomer !== 'direct') {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) customerData = { customer_id: selectedCustomer, customer_name: customer.name };
    }

    const saleData = {
      ...customerData,
      items: selectedItems.map(item => ({ product_id: item.product_id, variation_id: item.variation_id || null, product_name: item.variation_name ? `${item.product_name} - ${item.variation_name}` : item.product_name, quantity: item.quantity, unit_price: item.unit_price, total: item.total })),
      total: calculateTotal(), subtotal: calculateSubtotal(), discount: calculateDiscount(), tax: 0, payment_method: paymentMethod, payment_status: paymentStatus, due_date: paymentStatus === 'paid' ? new Date().toISOString() : dueDate, total_cost: calculateTotalCost()
    };

    const result = await addSale(saleData);
    if (result?.error) showNotification('error', result.error);
    else { showNotification('success', 'Venda finalizada com sucesso!'); resetForm(); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const getStatusIcon = (status: string) => ({ completed: <CheckCircle className="w-4 h-4 text-green-600" />, paid: <CheckCircle className="w-4 h-4 text-green-600" />, pending: <Clock className="w-4 h-4 text-amber-600" />, cancelled: <XCircle className="w-4 h-4 text-red-600" />, overdue: <XCircle className="w-4 h-4 text-red-600" /> }[status] || null);
  const getPaymentMethodLabel = (method: string) => ({ pix: 'PIX', boleto: 'Boleto', card: 'Cartão', cash: 'Dinheiro' }[method as 'pix' | 'boleto' | 'card' | 'cash'] || method);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {notification && <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}><div className="flex items-center">{notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}{notification.message}</div></div>}
      {usageStatus.showLimitMessage.sales && showLimitBanner && <UsageLimitBanner onUpgrade={() => setShowUpgradeModal(true)} onDismiss={() => setShowLimitBanner(false)} limit={usageStatus.limits.sales} count={usageStatus.counts.sales} text="registros de vendas" />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Vendas</h1>
          <p className="text-gray-600">Gerencie suas vendas e controle de estoque.</p>
        </div>
        <button onClick={handleAddSale} disabled={!usageStatus.canAdd.sales} className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${usageStatus.canAdd.sales ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Plus className="w-5 h-5 mr-2" />Nova Venda</button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input type="text" placeholder="Buscar por cliente ou nº da venda..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
      </div>
      {filteredSales.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{sale.invoice_number}</div><div className="text-sm text-gray-500">{sale.items?.length || 0} item(s)</div></td>
                    <td className="px-6 py-4 text-gray-900">{sale.customer_name}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4 text-gray-900">{getPaymentMethodLabel(sale.payment_method)}</td>
                    <td className="px-6 py-4"><div className="flex items-center">{getStatusIcon(sale.payment_status)}<span className="ml-2 capitalize">{sale.payment_status}</span></div></td>
                    <td className="px-6 py-4 text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {filteredSales.map((sale, index) => (
              <div key={sale.id} className={`p-4 ${index < filteredSales.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div><p className="font-bold text-gray-900">{sale.invoice_number}</p><p className="text-sm text-gray-600">{sale.customer_name}</p></div>
                  <div className="text-right"><p className="font-bold text-green-600">{formatCurrency(sale.total)}</p><p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</p></div>
                </div>
                <div className="flex items-center justify-between text-sm"><div className="flex items-center">{getStatusIcon(sale.payment_status)}<span className="ml-2 capitalize">{sale.payment_status}</span></div><span>{getPaymentMethodLabel(sale.payment_method)}</span></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12"><ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" /><h3 className="text-lg font-medium">Nenhuma venda encontrada</h3><p className="text-gray-600 mb-6">{searchTerm ? 'Tente ajustar sua busca' : 'Comece registrando sua primeira venda'}</p></div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            <div className="inline-block w-full max-w-7xl p-4 sm:p-6 my-8 text-left align-middle bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center"><div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4"><ShoppingCart className="w-6 h-6 text-white" /></div><div><h3 className="text-xl sm:text-2xl font-bold">Nova Venda</h3><p className="text-sm text-gray-600">Adicione produtos e clientes à venda</p></div></div>
                <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border-2 border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center"><User className="w-5 h-5 mr-2" /> Cliente</h4>
                      <div className="relative mb-6">
                        <input type="text" value={customerSearchTerm} onChange={(e) => { setCustomerSearchTerm(e.target.value); setShowCustomerDropdown(true); if (!e.target.value) setSelectedCustomer(''); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" placeholder="Buscar cliente ou venda direta" />
                        {showCustomerDropdown && (<div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-300 rounded-xl shadow-xl max-h-60 overflow-y-auto"><button type="button" onClick={handleDirectSale} className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b flex items-center"><ShoppingCart className="w-4 h-4 mr-3 text-blue-600" /><div><div className="font-medium">Venda Direta</div><div className="text-sm text-gray-500">Sem vínculo com cliente</div></div></button>{filteredCustomers.map(c => <button key={c.id} type="button" onClick={() => handleCustomerSelect(c.id, c.name)} className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center"><User className="w-4 h-4 mr-3" /><div><div className="font-medium">{c.name}</div><div className="text-sm text-gray-500">{c.email}</div></div></button>)}</div>)}
                      </div>
                      <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-blue-900 mb-2">Forma de Pagamento</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"><option value="pix">PIX</option><option value="card">Cartão</option><option value="boleto">Boleto</option><option value="cash">Dinheiro</option></select></div>
                        <div><label className="block text-sm font-medium text-blue-900 mb-2">Status do Pagamento</label><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"><option value="paid">Pago</option><option value="pending">Pendente</option><option value="overdue">Vencido</option></select></div>
                        {paymentStatus !== 'paid' && <div><label className="block text-sm font-medium text-blue-900 mb-2">Data de Vencimento</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white" required /></div>}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1 bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border-2 border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center"><Package className="w-5 h-5 mr-2" /> Produtos</h4>
                    <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white" placeholder="Buscar produtos..." /></div>
                    <div className="max-h-[500px] overflow-y-auto space-y-3 p-1">
                      {filteredProductsForSale.length > 0 ? filteredProductsForSale.map(product => {
                        const stockStatus = getStockStatus(product.stock, product.min_stock);
                        const variations = getVariationsForProduct(product.id);
                        const isExpanded = expandedProducts.has(product.id);
                        return (
                          <div key={product.id} className="bg-white rounded-xl border-2 border-green-200 overflow-hidden">
                            <div className="p-4">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 w-full">
                                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border-2"><img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /></div>
                                  <div className="flex-grow"><div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2"><h5 className="font-semibold text-gray-900 text-lg">{product.name}</h5><span className={`px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>{stockStatus.label}</span></div><p className="text-lg font-bold text-green-600 mb-1">{formatCurrency(product.price)}</p></div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0">
                                  {variations.length > 0 && <button type="button" onClick={() => toggleProductExpansion(product.id)} className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 border border-purple-300"><Grid className="w-4 h-4 mr-1" /><span>{variations.length} Variações</span>{isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}</button>}
                                  <button type="button" onClick={() => addItemToSale(product.id)} disabled={product.stock === 0} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${product.stock === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>{product.stock === 0 ? 'Sem Estoque' : 'Adicionar'}</button>
                                </div>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-t-2 border-purple-200 p-4 space-y-3">
                                {variations.map(variation => (
                                  <div key={variation.id} className="bg-white rounded-lg p-3 border-2 border-purple-200">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border flex-shrink-0"><img src={variation.image_url} alt={variation.variation_name} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1"><p className="font-medium text-gray-900">{variation.variation_name}</p><div className="flex flex-wrap gap-2 text-xs text-gray-500 my-1">{variation.color && <span className="flex items-center bg-gray-100 px-2 py-1 rounded"><Palette className="w-3 h-3 mr-1" />{variation.color}</span>}{variation.size && <span className="flex items-center bg-gray-100 px-2 py-1 rounded"><Ruler className="w-3 h-3 mr-1" />{variation.size}</span>}</div><div className="flex justify-between items-center"><p className="font-bold text-purple-600">{formatCurrency(variation.price || product.price)}</p><p className="text-xs">Estoque: {variation.stock}</p></div></div>
                                      </div>
                                      <button type="button" onClick={() => addItemToSale(product.id, variation.id)} disabled={variation.stock <= 0} className={`w-full sm:w-auto flex-shrink-0 px-3 py-2 text-sm rounded-lg ${variation.stock <= 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white'}`}>Adicionar</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }) : <div className="text-center py-8"><Package className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Nenhum produto encontrado</p></div>}
                    </div>
                  </div>
                  <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-amber-100 p-4 sm:p-6 rounded-xl border-2 border-amber-200">
                    <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Carrinho ({selectedItems.length})</h4>
                    {selectedItems.length > 0 ? <>
                      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto p-1">
                        {selectedItems.map(item => (
                          <div key={item.id} className="bg-white rounded-xl p-4 border-2 border-amber-200">
                            <div className="flex items-start space-x-3 mb-3"><div className="flex-1"><p className="font-medium">{item.product_name} {item.variation_name && `- ${item.variation_name}`}</p><p className="text-xs text-gray-500">{formatCurrency(item.unit_price)} × {item.quantity}</p></div><button type="button" onClick={() => removeItemFromSale(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div>
                            <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><button type="button" onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><Minus className="w-4 h-4" /></button><span className="w-12 text-center font-medium bg-gray-100 py-1 rounded">{item.quantity}</span><button type="button" onClick={() => updateItemQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.available_stock} className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 flex items-center justify-center text-white"><Plus className="w-4 h-4" /></button></div><div className="text-right"><p className="font-bold text-green-600 text-lg">{formatCurrency(item.total)}</p><p className="text-xs text-gray-500">Disp: {item.available_stock}</p></div></div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-amber-200 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Subtotal:</span><span className="font-medium">{formatCurrency(calculateSubtotal())}</span></div>
                        {calculateDiscount() > 0 && <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Desconto:</span><span className="font-medium text-red-600">-{formatCurrency(calculateDiscount())}</span></div>}
                        <div className="border-t-2 pt-3"><div className="flex justify-between items-center text-xl font-bold"><span className="text-amber-900">Total:</span><span className="text-green-600">{formatCurrency(calculateTotal())}</span></div><div className="flex justify-between items-center text-sm mt-2"><span className="text-gray-600">Lucro Estimado:</span><span className={`font-medium ${(calculateTotal() - calculateTotalCost()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculateTotal() - calculateTotalCost())}</span></div></div>
                      </div>
                    </> : <div className="text-center py-8"><ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="font-medium">Carrinho vazio</p></div>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t-2">
                  <button type="button" onClick={resetForm} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">Cancelar</button>
                  <button type="submit" disabled={selectedItems.length === 0} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 font-medium">Finalizar Venda ({formatCurrency(calculateTotal())})</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};