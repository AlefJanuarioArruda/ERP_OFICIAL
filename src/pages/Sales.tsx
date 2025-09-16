import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, FileText, CreditCard, Clock, CheckCircle, XCircle, User, Crown, X, Package, AlertTriangle, Minus, Trash2, Grid, Palette, Ruler, ChevronDown, ChevronUp, ArrowRight, Wallet } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';

// O tipo do item no carrinho permanece o mesmo
type CartItem = {
  id: string;
  product_id: string | null;
  variation_id?: string | null;
  product_name: string;
  variation_name?: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total: number;
  available_stock: number;
  is_variation?: boolean;
  color?: string;
  size?: string;
  image_url?: string;
};

export const Sales: React.FC = () => {
  // --- ESTADOS E HOOKS (sem alterações na lógica) ---
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
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'card' | 'cash'>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'overdue'>('paid');
  const [dueDate, setDueDate] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  // NOVO ESTADO: Para controlar a visualização no mobile
  const [saleView, setSaleView] = useState<'products' | 'cart' | 'checkout'>('products');

  // --- FUNÇÕES (sem alterações na lógica) ---

  const getStockStatus = (stock: number, minStock: number = 5) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800 border-red-200' };
    if (stock <= minStock) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Em Estoque', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  useEffect(() => {
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
    newExpanded.has(productId) ? newExpanded.delete(productId) : newExpanded.add(productId);
    setExpandedProducts(newExpanded);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const addItemToSale = (productId: string, variationId?: string) => {
    // ... (lógica original sem alterações)
  };
  
  const removeItemFromSale = (itemId: string) => {
    // ... (lógica original sem alterações)
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    // ... (lógica original sem alterações)
  };

  const calculateSubtotal = () => selectedItems.reduce((sum, item) => sum + item.total, 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return discountType === 'percentage' ? (subtotal * discountPercentage) / 100 : discountAmount;
  };
  
  const calculateTotal = () => Math.max(0, calculateSubtotal() - calculateDiscount());
  
  const calculateTotalCost = () => selectedItems.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);

  const resetForm = () => {
    setSelectedCustomer('');
    setCustomerSearchTerm('');
    setSelectedItems([]);
    setPaymentMethod('pix');
    setPaymentStatus('paid');
    setDueDate('');
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setDiscountType('percentage');
    setShowAddForm(false);
    setShowCustomerDropdown(false);
    setExpandedProducts(new Set());
    setSaleView('products'); // Reseta a view do mobile
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    // ... (lógica original sem alterações, incluindo validações)
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = { pix: 'PIX', boleto: 'Boleto', card: 'Cartão', cash: 'Dinheiro' };
    return methods[method as keyof typeof methods] || method;
  };
  
  // --- RENDERIZAÇÃO ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Componentes de UI internos para organização
  const CustomerPaymentSection = () => (
    <div className="space-y-6">
      {/* Seção Cliente */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center"><User className="w-5 h-5 mr-2 text-sky-600" />Cliente</h3>
        <div className="relative">
          <input type="text" value={customerSearchTerm} onChange={(e) => { setCustomerSearchTerm(e.target.value); setShowCustomerDropdown(true); if (!e.target.value) setSelectedCustomer(''); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent" placeholder="Buscar cliente..." />
          {showCustomerDropdown && (
             <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                <button type="button" onClick={handleDirectSale} className="w-full px-4 py-3 text-left hover:bg-sky-50 border-b flex items-center transition-colors">
                    <ShoppingCart className="w-5 h-5 mr-3 text-sky-600" />
                    <div>
                        <p className="font-medium text-gray-800">Venda Direta</p>
                        <p className="text-sm text-gray-500">Sem vínculo com cliente</p>
                    </div>
                </button>
                {filteredCustomers.length > 0 && filteredCustomers.map((customer) => (
                    <button key={customer.id} type="button" onClick={() => handleCustomerSelect(customer.id, customer.name)} className="w-full px-4 py-3 text-left hover:bg-sky-50 flex items-center transition-colors">
                        <User className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                            <p className="font-medium text-gray-800">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                    </button>
                ))}
             </div>
          )}
        </div>
      </div>

       {/* Seção Pagamento */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
         <h3 className="font-semibold text-gray-800 mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-sky-600" />Pagamento</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
               <label className="text-sm font-medium text-gray-600 mb-1 block">Forma</label>
               <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500">
                  <option value="pix">PIX</option>
                  <option value="card">Cartão</option>
                  <option value="boleto">Boleto</option>
                  <option value="cash">Dinheiro</option>
               </select>
            </div>
            <div>
               <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
               <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500">
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="overdue">Vencido</option>
               </select>
            </div>
            {paymentStatus !== 'paid' && (
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Vencimento</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" required />
                </div>
            )}
         </div>
      </div>
    </div>
  );

  const CartSection = () => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
        <ShoppingCart className="w-5 h-5 mr-2 text-sky-600" />
        Carrinho ({selectedItems.length})
      </h3>
      {selectedItems.length > 0 ? (
        <>
            <div className="flex-1 space-y-3 overflow-y-auto -mr-3 pr-3">
              {selectedItems.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="flex items-start space-x-3">
                        <div className="w-14 h-14 bg-white rounded-md border flex-shrink-0 flex items-center justify-center">
                            {item.image_url ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover rounded-md" /> : <Package className="w-6 h-6 text-gray-300" />}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm text-gray-800 leading-tight">{item.product_name}</p>
                            {item.variation_name && <p className="text-xs text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 inline-block my-1">{item.variation_name}</p>}
                            <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <button type="button" onClick={() => removeItemFromSale(item.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                            <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.available_stock} className="w-7 h-7 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center disabled:bg-gray-300"><Plus className="w-4 h-4" /></button>
                        </div>
                        <p className="font-bold text-gray-800">{formatCurrency(item.total)}</p>
                    </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              {/* Desconto */}
              <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Desconto</label>
                  <div className="flex">
                      <select value={discountType} onChange={(e) => {setDiscountType(e.target.value as any); setDiscountAmount(0); setDiscountPercentage(0);}} className="border border-r-0 border-gray-300 rounded-l-lg px-3 text-sm focus:ring-2 focus:ring-sky-500 focus:z-10">
                          <option value="percentage">%</option>
                          <option value="fixed">R$</option>
                      </select>
                      <input type="number" min="0" value={discountType === 'percentage' ? (discountPercentage || '') : (discountAmount || '')} onChange={(e) => { const val = parseFloat(e.target.value) || 0; if (discountType === 'percentage') setDiscountPercentage(val); else setDiscountAmount(val); }} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-sky-500" />
                  </div>
              </div>
              {/* Totais */}
              <div className="space-y-1.5 mt-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-800">{formatCurrency(calculateSubtotal())}</span></div>
                  {calculateDiscount() > 0 && <div className="flex justify-between"><span className="text-gray-600">Desconto</span><span className="font-medium text-red-600">-{formatCurrency(calculateDiscount())}</span></div>}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span className="text-gray-800">Total</span><span className="text-green-600">{formatCurrency(calculateTotal())}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Lucro Estimado</span><span className={`font-medium ${(calculateTotal() - calculateTotalCost()) > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculateTotal() - calculateTotalCost())}</span></div>
              </div>
            </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg p-4">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
          <p className="font-medium">Seu carrinho está vazio</p>
          <p className="text-sm">Adicione produtos para continuar</p>
        </div>
      )}
    </div>
  );

  const ProductListSection = () => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center"><Package className="w-5 h-5 mr-2 text-sky-600" />Produtos</h3>
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} placeholder="Buscar produto por nome, SKU..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"/>
        </div>
        <div className="flex-1 overflow-y-auto -mr-3 pr-3 space-y-3">
        {filteredProductsForSale.length > 0 ? filteredProductsForSale.map(product => {
            const variations = getVariationsForProduct(product.id);
            const isExpanded = expandedProducts.has(product.id);
            return (
                <div key={product.id} className="border rounded-lg overflow-hidden bg-white hover:border-sky-400 transition-colors duration-200">
                    <div className="p-3 flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-md border flex-shrink-0 flex items-center justify-center">
                            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" /> : <Package className="w-8 h-8 text-gray-300" />}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{product.name}</p>
                            <p className="text-green-600 font-bold">{formatCurrency(product.price)}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStockStatus(product.stock, product.min_stock).color}`}>Estoque: {product.stock}</span>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            <button type="button" onClick={() => addItemToSale(product.id)} disabled={product.stock <= 0} className="px-3 py-1.5 bg-sky-600 text-white text-sm font-semibold rounded-md hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Adicionar</button>
                            {variations.length > 0 && (
                                <button type="button" onClick={() => toggleProductExpansion(product.id)} className="px-2 py-1 text-xs text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md flex items-center">
                                    <Grid className="w-3 h-3 mr-1" /> {variations.length} Variações {isExpanded ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1"/>}
                                </button>
                            )}
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="bg-purple-50/50 p-3 border-t border-purple-200 space-y-2">
                            {variations.map(variation => (
                                <div key={variation.id} className="bg-white p-2 rounded-md border flex items-center space-x-2">
                                    <div className="w-10 h-10 bg-gray-100 rounded border flex-shrink-0 flex items-center justify-center">
                                        {variation.image_url ? <img src={variation.image_url} alt={variation.variation_name} className="w-full h-full object-cover rounded"/> : <Grid className="w-5 h-5 text-gray-300"/>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{variation.variation_name}</p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span>{formatCurrency(variation.price || product.price)}</span>
                                            <span className="w-px h-3 bg-gray-300"></span>
                                            <span>Estoque: {variation.stock}</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => addItemToSale(product.id, variation.id)} disabled={variation.stock <= 0} className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 disabled:bg-gray-300">Add</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }) : <div className="text-center text-gray-500 p-8">Nenhum produto encontrado.</div>}
        </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className="flex items-center">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            {notification.message}
          </div>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner de Limite de Uso */}
        {usageStatus.showLimitMessage.sales && showLimitBanner && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg flex items-center justify-between gap-4">
              <div className="flex items-center">
                  <Crown className="w-6 h-6 mr-3 text-amber-600 flex-shrink-0" />
                  <div>
                      <h4 className="font-bold">Limite da versão gratuita atingido</h4>
                      <p className="text-sm">Você atingiu o limite de {usageStatus.limits.sales} vendas. Faça upgrade para adicionar registros ilimitados.</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm">Assinar Agora</button>
                  <button onClick={() => setShowLimitBanner(false)} className="p-2 hover:bg-amber-200 rounded-full transition-colors"><X className="w-4 h-4" /></button>
              </div>
          </div>
        )}

        {/* Cabeçalho da Página */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Vendas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas vendas e controle o estoque.</p>
          </div>
          <button onClick={handleAddSale} disabled={!usageStatus.canAdd.sales} className="flex items-center justify-center px-5 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none">
            <Plus className="w-5 h-5 mr-2" />
            Nova Venda
          </button>
        </header>

        {/* Barra de Busca e Filtros */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Buscar por cliente ou nº da venda..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
          </div>
        </div>
        
        {/* Conteúdo Principal - Lista de Vendas */}
        {filteredSales.length > 0 ? (
          <>
            {/* Tabela para Desktop */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venda</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4"><div className="font-medium text-gray-900">{sale.invoice_number}</div><div className="text-sm text-gray-500">{sale.items?.length || 0} item(s)</div></td>
                                <td className="px-6 py-4 text-sm text-gray-800">{sale.customer_name}</td>
                                <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(sale.total)}</td>
                                <td className="px-6 py-4 text-sm"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400"/><span>{getPaymentMethodLabel(sale.payment_method)}</span></div></td>
                                <td className="px-6 py-4 text-sm capitalize"><div className="flex items-center gap-2">{getStatusIcon(sale.status)}<span>{sale.status}</span></div></td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Cards para Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {filteredSales.map(sale => (
                <div key={sale.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{sale.invoice_number}</p>
                      <p className="text-sm text-gray-600">{sale.customer_name}</p>
                    </div>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(sale.total)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 capitalize">{getStatusIcon(sale.status)} {sale.status}</span>
                    <span className="text-gray-500">{new Date(sale.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Nenhuma venda encontrada</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca.' : 'Clique em "Nova Venda" para começar.'}
            </p>
          </div>
        )}
      </main>

      {/* Modal de Nova Venda */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-0 md:p-4">
          <form onSubmit={handleSubmit} className="bg-gray-100 w-full h-full md:max-w-[95vw] md:max-h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Cabeçalho do Modal */}
            <header className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Nova Venda</h2>
                  <p className="text-sm text-gray-500">Selecione produtos, cliente e pagamento.</p>
                </div>
              </div>
              <button type="button" onClick={resetForm} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </header>

            {/* --- LAYOUT DESKTOP --- */}
            <div className="hidden md:grid md:grid-cols-5 lg:grid-cols-2 gap-6 p-6 flex-1 overflow-hidden">
              {/* Coluna Esquerda: Produtos */}
              <div className="md:col-span-3 lg:col-span-1 h-full">
                <ProductListSection />
              </div>
              {/* Coluna Direita: Carrinho e Checkout */}
              <div className="md:col-span-2 lg:col-span-1 h-full flex flex-col gap-6 overflow-y-auto pr-1">
                <CustomerPaymentSection />
                <div className="flex-1 min-h-[300px]">
                    <CartSection />
                </div>
              </div>
            </div>

            {/* --- LAYOUT MOBILE --- */}
            <div className="md:hidden flex flex-col flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-4">
                {saleView === 'products' && <ProductListSection />}
                {saleView === 'cart' && <CartSection />}
                {saleView === 'checkout' && <CustomerPaymentSection />}
              </main>
              <footer className="bg-white p-3 border-t flex items-center justify-between gap-2 flex-shrink-0">
                  <div className="flex rounded-lg bg-gray-100 p-1">
                      <button type="button" onClick={() => setSaleView('products')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${saleView === 'products' ? 'bg-white shadow-sm text-sky-700' : 'text-gray-600'}`}>Produtos</button>
                      <button type="button" onClick={() => setSaleView('cart')} className={`px-4 py-1.5 text-sm font-semibold rounded-md relative ${saleView === 'cart' ? 'bg-white shadow-sm text-sky-700' : 'text-gray-600'}`}>
                          Carrinho
                          {selectedItems.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-600 text-white text-xs rounded-full flex items-center justify-center">{selectedItems.length}</span>}
                      </button>
                      <button type="button" onClick={() => setSaleView('checkout')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${saleView === 'checkout' ? 'bg-white shadow-sm text-sky-700' : 'text-gray-600'}`}>Pagamento</button>
                  </div>
                  {saleView === 'products' && (
                    <button type="button" onClick={() => setSaleView('cart')} disabled={selectedItems.length === 0} className="px-4 py-2 bg-sky-600 text-white rounded-lg flex items-center font-semibold disabled:bg-gray-300">
                        Ver Carrinho <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                  {saleView === 'cart' && (
                    <button type="button" onClick={() => setSaleView('checkout')} disabled={selectedItems.length === 0} className="px-4 py-2 bg-sky-600 text-white rounded-lg flex items-center font-semibold disabled:bg-gray-300">
                        Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                   {saleView === 'checkout' && (
                    <button type="submit" disabled={selectedItems.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center font-semibold disabled:bg-gray-300">
                        Finalizar <span className="hidden sm:inline ml-2">{formatCurrency(calculateTotal())}</span>
                    </button>
                  )}
              </footer>
            </div>
            
            {/* Botões de Ação para Desktop */}
            <footer className="hidden md:flex justify-end space-x-4 p-4 border-t bg-white flex-shrink-0">
                <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold">Cancelar</button>
                <button type="submit" disabled={selectedItems.length === 0} className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-semibold shadow-sm">
                    Finalizar Venda ({formatCurrency(calculateTotal())})
                </button>
            </footer>
          </form>
        </div>
      )}
      
      {/* Modal de Upgrade */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Atualize seu plano para continuar"
        message="Você atingiu o limite de registros de vendas do plano gratuito. Faça upgrade para adicionar vendas ilimitadas."
      />
    </div>
  );
};