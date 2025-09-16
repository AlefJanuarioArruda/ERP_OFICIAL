import React, { useState } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, Crown, X, Upload, Camera, Save, Eye, Palette, Ruler, Grid } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Products: React.FC = () => {
  const { 
    products, 
    productVariations,
    addProduct, 
    updateProduct, 
    deleteProduct,
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
    getVariationsForProduct,
    uploadProductImage,
    loading 
  } = useSupabaseData();
  
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteVariationConfirm, setShowDeleteVariationConfirm] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock: '',
    min_stock: '',
    category: '',
    sku: '',
    supplier: ''
  });

  const [variationFormData, setVariationFormData] = useState({
    variation_name: '',
    color: '',
    size: '',
    sku: '',
    stock: '',
    price: ''
  });

  // Effect to show limit banner when limit is reached
  React.useEffect(() => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowLimitBanner(true);
    }
  }, [usageStatus.isLimitReached.products, usageStatus.isSubscriptionActive]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      stock: '',
      min_stock: '',
      category: '',
      sku: '',
      supplier: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowAddForm(false);
    setEditingProduct(null);
    setShowUpgradeModal(false);
  };

  const resetVariationForm = () => {
    setVariationFormData({
      variation_name: '',
      color: '',
      size: '',
      sku: '',
      stock: '',
      price: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowVariationForm(false);
    setSelectedProductForVariation(null);
    setEditingVariation(null);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddProduct = () => {
    if (!usageStatus.canAdd.products) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
  };

  const handleAddVariation = (productId: string) => {
    if (!usageStatus.canAdd.products) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedProductForVariation(productId);
    setShowVariationForm(true);
  };

  const handleEdit = (product: any) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      category: product.category,
      sku: product.sku,
      supplier: product.supplier
    });
    setImagePreview(product.image_url);
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleEditVariation = (variation: any) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    setVariationFormData({
      variation_name: variation.variation_name,
      color: variation.color || '',
      size: variation.size || '',
      sku: variation.sku,
      stock: variation.stock.toString(),
      price: variation.price?.toString() || ''
    });
    setImagePreview(variation.image_url);
    setEditingVariation(variation);
    setSelectedProductForVariation(variation.product_id);
    setShowVariationForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const { error } = await deleteProduct(productId);
    
    if (error) {
      showNotification('error', 'Erro ao excluir produto');
    } else {
      showNotification('success', 'Produto excluído com sucesso');
    }
    
    setShowDeleteConfirm(null);
  };

  const handleDeleteVariation = async (variationId: string) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const { error } = await deleteProductVariation(variationId);
    
    if (error) {
      showNotification('error', 'Erro ao excluir variação');
    } else {
      showNotification('success', 'Variação excluída com sucesso');
    }
    
    setShowDeleteVariationConfirm(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      stock: parseInt(formData.stock),
      min_stock: parseInt(formData.min_stock),
      category: formData.category,
      sku: formData.sku,
      supplier: formData.supplier,
      image_url: imagePreview
    };

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData, imageFile || undefined);
    } else {
      result = await addProduct(productData, imageFile || undefined);
    }
    
    if (result?.error) {
      showNotification('error', result.error);
    } else {
      showNotification('success', editingProduct ? 'Produto atualizado com sucesso' : 'Produto adicionado com sucesso');
      resetForm();
    }
  };

  const handleVariationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductForVariation) return;

    const variationData = {
      product_id: selectedProductForVariation,
      variation_name: variationFormData.variation_name,
      color: variationFormData.color || null,
      size: variationFormData.size || null,
      sku: variationFormData.sku,
      stock: parseInt(variationFormData.stock),
      price: variationFormData.price ? parseFloat(variationFormData.price) : null,
      image_url: imagePreview
    };

    let result;
    if (editingVariation) {
      result = await updateProductVariation(editingVariation.id, variationData, imageFile || undefined);
    } else {
      result = await addProductVariation(variationData, imageFile || undefined);
    }
    
    if (result?.error) {
      showNotification('error', result.error);
    } else {
      showNotification('success', editingVariation ? 'Variação atualizada com sucesso' : 'Variação adicionada com sucesso');
      resetVariationForm();
    }
  };

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { color: 'text-red-600 bg-red-50', label: 'Sem Estoque' };
    } else if (stock <= minStock) {
      return { color: 'text-amber-600 bg-amber-50', label: 'Estoque Baixo' };
    } else {
      return { color: 'text-green-600 bg-green-50', label: 'Em Estoque' };
    }
  };

  const getTotalVariationStock = (productId: string) => {
    const variations = getVariationsForProduct(productId);
    return variations.reduce((total, variation) => total + variation.stock, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando produtos...</p>
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
              <Eye className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Limit Message for Products */}
      {usageStatus.showLimitMessage.products && showLimitBanner && (
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
          <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos, variações e estoque</p>
        </div>
        <button
          onClick={handleAddProduct}
          disabled={!usageStatus.canAdd.products}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            usageStatus.canAdd.products
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.min_stock);
            const profitMargin = product.price > 0 ? ((product.price - product.cost_price) / product.price * 100) : 0;
            const variations = getVariationsForProduct(product.id);
            const isExpanded = expandedProducts.has(product.id);
            const totalVariationStock = getTotalVariationStock(product.id);
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Main Product Card */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Product Image */}
                    <div className="lg:col-span-1">
                      <div className="h-48 bg-gray-100 relative overflow-hidden rounded-lg">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Stock Status Badge */}
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>SKU: {product.sku}</span>
                            <span>Categoria: {product.category}</span>
                            {product.supplier && <span>Fornecedor: {product.supplier}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Pricing and Stock Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium mb-1">Preço de Venda</p>
                          <p className="text-lg font-bold text-green-700">{formatCurrency(product.price)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium mb-1">Custo</p>
                          <p className="text-lg font-bold text-gray-700">{formatCurrency(product.cost_price)}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium mb-1">Estoque Principal</p>
                          <p className="text-lg font-bold text-blue-700">{product.stock} unidades</p>
                          <p className="text-xs text-blue-600">Mín: {product.min_stock}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-600 font-medium mb-1">Margem de Lucro</p>
                          <p className={`text-lg font-bold ${profitMargin > 30 ? 'text-green-600' : profitMargin > 15 ? 'text-amber-600' : 'text-red-600'}`}>
                            {profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Variations Summary */}
                      {variations.length > 0 && (
                        <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                          <p className="text-xs text-indigo-600 font-medium mb-1">Variações</p>
                          <p className="text-sm font-bold text-indigo-700">
                            {variations.length} variação(ões) • {totalVariationStock} unidades total
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex flex-col space-y-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex items-center justify-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Produto
                      </button>
                      
                      <button
                        onClick={() => handleAddVariation(product.id)}
                        className="flex items-center justify-center px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Grid className="w-4 h-4 mr-2" />
                        Nova Variação
                      </button>
                      
                      {variations.length > 0 && (
                        <button
                          onClick={() => toggleProductExpansion(product.id)}
                          className="flex items-center justify-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {isExpanded ? 'Ocultar' : 'Ver'} Variações ({variations.length})
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="flex items-center justify-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variations Section */}
                {isExpanded && variations.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Grid className="w-5 h-5 mr-2 text-indigo-600" />
                      Variações do Produto
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {variations.map((variation) => {
                        const variationStockStatus = getStockStatus(variation.stock, product.min_stock);
                        const variationPrice = variation.price || product.price;
                        const variationProfitMargin = variationPrice > 0 ? ((variationPrice - product.cost_price) / variationPrice * 100) : 0;
                        
                        return (
                          <div key={variation.id} className="bg-white rounded-lg border border-gray-200 p-4">
                            {/* Variation Image */}
                            <div className="h-32 bg-gray-100 relative overflow-hidden rounded-lg mb-3">
                              {variation.image_url ? (
                                <img
                                  src={variation.image_url}
                                  alt={variation.variation_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${variationStockStatus.color}`}>
                                {variationStockStatus.label}
                              </div>
                            </div>

                            {/* Variation Info */}
                            <div className="space-y-2">
                              <h5 className="font-semibold text-gray-900">{variation.variation_name}</h5>
                              
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
                              </div>
                              
                              <p className="text-xs text-gray-500">SKU: {variation.sku}</p>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Preço</p>
                                  <p className="font-medium text-green-600">{formatCurrency(variationPrice)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Estoque</p>
                                  <p className="font-medium text-gray-900">{variation.stock}</p>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Margem: <span className={`font-medium ${variationProfitMargin > 30 ? 'text-green-600' : variationProfitMargin > 15 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {variationProfitMargin.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Variation Actions */}
                            <div className="flex items-center space-x-2 mt-3">
                              <button
                                onClick={() => handleEditVariation(variation)}
                                className="flex-1 flex items-center justify-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => setShowDeleteVariationConfirm(variation.id)}
                                className="flex-1 flex items-center justify-center px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando seu primeiro produto'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddProduct}
              disabled={!usageStatus.canAdd.products}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                usageStatus.canAdd.products
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Escolher Imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP até 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo do Produto</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Category and Supplier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Profit Margin Preview */}
                {formData.price && formData.cost_price && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Margem de Lucro:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-blue-700">Lucro por unidade:</span>
                      <span className="text-sm font-medium text-blue-700">
                        {formatCurrency(parseFloat(formData.price) - parseFloat(formData.cost_price))}
                      </span>
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? 'Atualizar' : 'Adicionar'} Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Variation Modal */}
      {showVariationForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetVariationForm}></div>
            
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Grid className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingVariation ? 'Editar Variação' : 'Nova Variação'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedProductForVariation && products.find(p => p.id === selectedProductForVariation)?.name}
                    </p>
                  </div>
                </div>
                <button onClick={resetVariationForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleVariationSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem da Variação</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Camera className="w-4 h-4 mr-2" />
                        Escolher Imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Opcional</p>
                    </div>
                  </div>
                </div>

                {/* Variation Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Variação</label>
                  <input
                    type="text"
                    value={variationFormData.variation_name}
                    onChange={(e) => setVariationFormData({...variationFormData, variation_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Azul - Tamanho M"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input
                      type="text"
                      value={variationFormData.color}
                      onChange={(e) => setVariationFormData({...variationFormData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Azul, Vermelho"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                    <input
                      type="text"
                      value={variationFormData.size}
                      onChange={(e) => setVariationFormData({...variationFormData, size: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: P, M, G, GG"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU da Variação</label>
                    <input
                      type="text"
                      value={variationFormData.sku}
                      onChange={(e) => setVariationFormData({...variationFormData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                    <input
                      type="number"
                      value={variationFormData.stock}
                      onChange={(e) => setVariationFormData({...variationFormData, stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Específico (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variationFormData.price}
                    onChange={(e) => setVariationFormData({...variationFormData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Deixe vazio para usar o preço do produto principal"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se não informado, será usado o preço do produto principal: {selectedProductForVariation && formatCurrency(products.find(p => p.id === selectedProductForVariation)?.price || 0)}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetVariationForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingVariation ? 'Atualizar' : 'Adicionar'} Variação
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
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
                Tem certeza que deseja excluir este produto? Todas as informações e variações serão perdidas permanentemente.
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
                  Excluir Produto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Variation Confirmation Modal */}
      {showDeleteVariationConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteVariationConfirm(null)}></div>
            
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
                Tem certeza que deseja excluir esta variação? Todas as informações serão perdidas permanentemente.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteVariationConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteVariation(showDeleteVariationConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir Variação
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
        title="Você atingiu o limite gratuito de 5 registros nesta seção"
        message="Faça upgrade para o plano pago para continuar adicionando."
      />
    </div>
  );
};