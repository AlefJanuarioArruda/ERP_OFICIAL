import React, { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Crown, CheckCircle, AlertCircle, X, Palette, Ruler } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { ProductVariation } from '../lib/supabase';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading, addProductVariation, updateProductVariation, deleteProductVariation, getVariationsForProduct } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [productVariationsFormData, setProductVariationsFormData] = useState<Omit<ProductVariation, 'id' | 'user_id' | 'product_id' | 'created_at' | 'updated_at'>[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showVariationsModal, setShowVariationsModal] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock: '',
    min_stock: '',
    category: '',
    sku: '',
    supplier: '',
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
      supplier: '',
    });
    setShowAddForm(false);
    setEditingProduct(null);
    setProductVariationsFormData([]);
    setShowUpgradeModal(false);
    setShowVariationsModal(null);
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
      supplier: formData.supplier
    };

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData);
    } else {
      result = await addProduct(productData);
    }

    if (result?.error) {
      showNotification('error', editingProduct ? 'Erro ao atualizar produto' : 'Erro ao adicionar produto');
      return;
    }
    
    const newProductId = editingProduct?.id || result?.data?.id;

    // Handle product variations
    if (newProductId && productVariationsFormData.length > 0) {
      try {
        // Clear existing variations if editing
        if (editingProduct) {
          const existingVariations = getVariationsForProduct(newProductId);
          for (const variation of existingVariations) {
            await deleteProductVariation(variation.id);
          }
        }
        
        // Add all variations from form
        for (const variation of productVariationsFormData) {
          if (variation.sku && variation.sku.trim()) {
            // Generate variation name if not provided
            let variationName = variation.variation_name;
            if (!variationName && (variation.color || variation.size)) {
              variationName = [variation.color, variation.size].filter(Boolean).join(' - ');
            }
            if (!variationName) {
              variationName = `Variação ${variation.sku}`;
            }
            
            await addProductVariation({
              product_id: newProductId,
              variation_name: variationName,
              color: variation.color || null,
              size: variation.size || null,
              sku: variation.sku,
              stock: variation.stock,
              price: variation.price
            });
          }
        }
        
        showNotification('success', editingProduct ? 'Produto e variações atualizados com sucesso' : 'Produto e variações adicionados com sucesso');
      } catch (error) {
        console.error('Error handling variations:', error);
        showNotification('error', 'Produto salvo, mas houve erro ao salvar variações');
      }
    } else {
      showNotification('success', editingProduct ? 'Produto atualizado com sucesso' : 'Produto adicionado com sucesso');
    }

    // Handle product variations
    if (newProductId) {
      // Clear existing variations if editing
      if (editingProduct) {
        const existingVariations = getVariationsForProduct(newProductId);
        for (const variation of existingVariations) {
          await deleteProductVariation(variation.id);
        }
      }
      
      // Add all variations from form
      for (const variation of productVariationsFormData) {
        if (variation.sku && variation.sku.trim()) {
          // Generate variation name if not provided
          let variationName = variation.variation_name;
          if (!variationName && (variation.color || variation.size)) {
            variationName = [variation.color, variation.size].filter(Boolean).join(' - ');
          }
          if (!variationName) {
            variationName = `Variação ${variation.sku}`;
          }
          
          await addProductVariation({
            product_id: newProductId,
            variation_name: variationName,
            color: variation.color || null,
            size: variation.size || null,
            sku: variation.sku,
            stock: variation.stock,
            price: variation.price
          });
        }
      }
    }
    resetForm();
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
      supplier: product.supplier || '',

    });
    
    // Load existing variations for editing
    const existingVariations = getVariationsForProduct(product.id);
    setProductVariationsFormData(existingVariations.map(v => ({
      variation_name: v.variation_name,
      color: v.color,
      size: v.size,
      sku: v.sku,
      stock: v.stock,
      price: v.price
    })));
    
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddVariation = () => {
    setProductVariationsFormData([
      ...productVariationsFormData,
      {
        variation_name: '',
        color: '',
        size: '',
        sku: '',
        stock: 0,
        price: null,
      }
    ]);
  };

  const handleRemoveVariation = (id: string) => {
    setProductVariationsFormData(productVariationsFormData.filter((_, index) => index.toString() !== id));
  };

  const handleVariationChange = (
    index: number,
    field: keyof Omit<ProductVariation, 'id' | 'user_id' | 'product_id' | 'created_at' | 'updated_at'>,
    value: string | number | null
  ) => {
    setProductVariationsFormData(
      productVariationsFormData.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo pessoal de produtos</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(product)}
                    disabled={false}
                    className={`p-1 transition-colors ${
                      usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-gray-400 hover:text-blue-600'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(product.id)}
                    disabled={false}
                    className={`p-1 transition-colors ${
                      usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preço</span>
                  <span className="font-semibold text-green-600">{formatCurrency(product.price)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estoque</span>
                  <div className="flex items-center space-x-2">
                    {product.stock <= product.min_stock && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`font-medium ${product.stock <= product.min_stock ? 'text-amber-600' : 'text-gray-900'}`}>
                      {product.stock} un.
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categoria</span>
                  <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">{product.category}</span>
                </div>

                {/* Variations Summary */}
                {(() => {
                  const variations = getVariationsForProduct(product.id);
                  if (variations.length > 0) {
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Variações</span>
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {variations.length} variação{variations.length > 1 ? 'ões' : ''}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <p className="text-sm text-gray-600 mt-3 line-clamp-2">{product.description}</p>

              {/* View Variations Button */}
              {(() => {
                const variations = getVariationsForProduct(product.id);
                if (variations.length > 0) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setShowVariationsModal(product.id)}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Ver Variações ({variations.length})
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ))}
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
            
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-5 h-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
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
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
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

                <div className="grid grid-cols-2 gap-4">
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

                {/* Product Variations Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Variações (Opcional)</h4>
                  <p className="text-xs text-gray-500 mb-4">Adicione diferentes cores, tamanhos ou outras variações para este produto.</p>

                  {productVariationsFormData.map((variation, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(index.toString())}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                        title="Remover variação"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Cor</label>
                          <div className="relative">
                            <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={variation.color || ''}
                              onChange={(e) => handleVariationChange(index, 'color', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Ex: Azul, Vermelho"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tamanho</label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={variation.size || ''}
                              onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Ex: P, M, G, 38, 40"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SKU da Variação</label>
                          <input
                            type="text"
                            value={variation.sku}
                            onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="SKU único"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Estoque</label>
                          <input
                            type="number"
                            value={variation.stock}
                            onChange={(e) => handleVariationChange(index, 'stock', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Preço (Opcional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variation.price || ''}
                            onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Herdar do produto"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Variação
                  </button>
                </div>

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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingProduct ? 'Atualizar' : 'Adicionar'} Produto
                  </button>
                </div>
              </form>
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
                Tem certeza que deseja excluir este produto? Todas as informações serão perdidas permanentemente.
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

      {/* Variations View Modal */}
      {showVariationsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowVariationsModal(null)}></div>
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Variações do Produto
                  </h3>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const product = products.find(p => p.id === showVariationsModal);
                      return product ? product.name : 'Produto';
                    })()}
                  </p>
                </div>
                <button 
                  onClick={() => setShowVariationsModal(null)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const variations = getVariationsForProduct(showVariationsModal);
                  
                  if (variations.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Nenhuma variação encontrada para este produto</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {variations.map((variation) => (
                        <div key={variation.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{variation.variation_name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {variation.sku}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {variation.color && (
                              <div className="flex items-center">
                                <Palette className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">Cor:</span>
                                <span className="text-sm font-medium text-gray-900 ml-1">{variation.color}</span>
                              </div>
                            )}
                            
                            {variation.size && (
                              <div className="flex items-center">
                                <Ruler className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">Tamanho:</span>
                                <span className="text-sm font-medium text-gray-900 ml-1">{variation.size}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Package className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">Estoque:</span>
                              <span className={`text-sm font-medium ml-1 ${
                                variation.stock <= 5 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {variation.stock} unidades
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">Preço:</span>
                              <span className="text-sm font-medium text-green-600 ml-1">
                                {variation.price ? formatCurrency(variation.price) : (
                                  <span className="text-gray-500">
                                    {(() => {
                                      const product = products.find(p => p.id === showVariationsModal);
                                      return product ? formatCurrency(product.price) + ' (herdado)' : 'N/A';
                                    })()}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {variation.stock <= 5 && (
                            <div className="mt-3 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Estoque baixo
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowVariationsModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fechar
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