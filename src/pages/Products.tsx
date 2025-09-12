import React, { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Crown, CheckCircle, AlertCircle, X, Palette, Ruler, DollarSign } from 'lucide-react';
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

  // Image upload states
  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [variationImages, setVariationImages] = useState<Map<number, { file: File; preview: string }>>(new Map());
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
    setSelectedProductImage(null);
    setProductImagePreview(null);
    setVariationImages(new Map());
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
    
    // Validate unique SKUs for variations
    if (productVariationsFormData.length > 0) {
      const variationSkus = productVariationsFormData
        .filter(v => v.sku && v.sku.trim())
        .map(v => v.sku.trim().toLowerCase());
      
      // Check for duplicates within the form
      const duplicatesInForm = variationSkus.filter((sku, index) => variationSkus.indexOf(sku) !== index);
      if (duplicatesInForm.length > 0) {
        showNotification('error', 'SKUs das variações devem ser únicos');
        return;
      }
      
      // Check for duplicates with existing variations (excluding current product if editing)
      const allExistingVariations = products.flatMap(product => {
        if (editingProduct && product.id === editingProduct.id) {
          return []; // Skip current product when editing
        }
        return getVariationsForProduct(product.id);
      });
      
      const existingSkus = allExistingVariations.map(v => v.sku.toLowerCase());
      const duplicateWithExisting = variationSkus.find(sku => existingSkus.includes(sku));
      
      if (duplicateWithExisting) {
        showNotification('error', `SKU "${duplicateWithExisting}" já está em uso em outro produto`);
        return;
      }
    }
    
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
      result = await updateProduct(editingProduct.id, productData, selectedProductImage || undefined);
    } else {
      result = await addProduct(productData, selectedProductImage || undefined);
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
        for (let i = 0; i < productVariationsFormData.length; i++) {
          const variation = productVariationsFormData[i];
          if (variation.sku && variation.sku.trim()) {
            // Generate variation name if not provided
            let variationName = variation.variation_name;
            if (!variationName && (variation.color || variation.size)) {
              variationName = [variation.color, variation.size].filter(Boolean).join(' - ');
            }
            if (!variationName) {
              variationName = `Variação ${variation.sku}`;
            }
            
            const variationImageFile = variationImages.get(i)?.file;
            
            await addProductVariation({
              product_id: newProductId,
              variation_name: variationName,
              color: variation.color || null,
              size: variation.size || null,
              sku: variation.sku,
              stock: variation.stock,
              price: variation.price
            }, variationImageFile);
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
    
    // Load existing variation images
    const newVariationImages = new Map();
    existingVariations.forEach((variation, index) => {
      if (variation.image_url) {
        newVariationImages.set(index, {
          file: null, // No file object for existing images
          preview: variation.image_url
        });
      }
    });
    setVariationImages(newVariationImages);
    
    setEditingProduct(product);
    setShowAddForm(true);
    
    // Set existing product image if available
    if (product.image_url) {
      setProductImagePreview(product.image_url);
    }
  };

  const handleProductImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedProductImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProductImage = () => {
    setSelectedProductImage(null);
    setProductImagePreview(null);
  };

  const handleVariationImageSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setVariationImages(prev => new Map(prev.set(index, { file, preview })));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVariationImage = (index: number) => {
    setVariationImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
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
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-blue-600" />
                    )}
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

                {/* Product Image Upload - Full Width */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    {/* Image Preview */}
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                      {productImagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={productImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveProductImage}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Package className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button - Responsive */}
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="cursor-pointer block">
                        <div className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Package className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">
                            {productImagePreview ? 'Alterar Imagem' : 'Adicionar Imagem'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">PNG, JPG até 5MB</p>
                    </div>
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
                      
                      {/* Variation Image Upload */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Imagem da Variação</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          {/* Image Preview */}
                          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                            {variationImages.get(index)?.preview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={variationImages.get(index)?.preview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariationImage(index)}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Palette className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                <span className="text-xs text-gray-500">Sem foto</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Upload Button */}
                          <div className="flex-1 w-full sm:w-auto">
                            <label className="cursor-pointer">
                              <div className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Palette className="w-3 h-3 mr-2 text-gray-500" />
                                <span className="text-xs text-gray-700 font-medium">
                                  {variationImages.get(index) ? 'Alterar' : 'Adicionar Foto'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleVariationImageSelect(index, e)}
                                className="hidden"
                              />
                            </label>
                            <p className="text-xs text-gray-400 mt-1 text-center sm:text-left">Opcional</p>
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
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {variation.image_url ? (
                                  <img
                                    src={variation.image_url}
                                    alt={variation.variation_name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                ) : (
                                  <Palette className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{variation.variation_name}</h4>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {variation.sku}
                                </span>
                              </div>
                            </div>
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