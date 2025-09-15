import React, { useState } from 'react';
import { Plus, Search, Package, Edit, Trash2, Eye, X, Upload, Camera, Crown, AlertTriangle } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { UsageLimitBanner } from '../components/UsageLimitBanner';

export const Products: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
    getVariationsForProduct,
    loading 
  } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [showAddVariationForm, setShowAddVariationForm] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [showDeleteVariationConfirm, setShowDeleteVariationConfirm] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variationImageFile, setVariationImageFile] = useState<File | null>(null);
  const [variationImagePreview, setVariationImagePreview] = useState<string | null>(null);
  const [showVariationsInForm, setShowVariationsInForm] = useState(false);
  const [tempVariations, setTempVariations] = useState<Array<{
    id: string;
    variation_name: string;
    color: string;
    size: string;
    sku: string;
    stock: number;
    price: number | null;
    image_url: string | null;
  }>>([]);

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
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
    setShowVariationsInForm(false);
    setTempVariations([]);
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
    setVariationImageFile(null);
    setVariationImagePreview(null);
    setShowAddVariationForm(false);
    setEditingVariation(null);
  };

  const handleAddProduct = () => {
    if (!usageStatus.canAdd.products) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
  };

  const handleAddVariation = (product: any) => {
    const currentVariations = getVariationsForProduct(product.id);
    if (!usageStatus.canAdd.variationsForProduct(product.id)) {
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedProduct(product);
    setShowAddVariationForm(true);
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
    setVariationFormData({
      variation_name: variation.variation_name,
      color: variation.color || '',
      size: variation.size || '',
      sku: variation.sku,
      stock: variation.stock.toString(),
      price: variation.price?.toString() || ''
    });
    setVariationImagePreview(variation.image_url);
    setEditingVariation(variation);
    setShowAddVariationForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    await deleteProduct(productId);
    setShowDeleteConfirm(null);
  };

  const handleDeleteVariation = async (variationId: string) => {
    await deleteProductVariation(variationId);
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

  const handleVariationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVariationImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setVariationImagePreview(e.target?.result as string);
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

    let productResult;
    
    if (editingProduct) {
      productResult = await updateProduct(editingProduct.id, productData, imageFile || undefined);
    } else {
      productResult = await addProduct(productData, imageFile || undefined);
    }
    
    // Se criou um novo produto e tem variações temporárias, adicionar as variações
    if (!editingProduct && productResult?.data && tempVariations.length > 0) {
      for (const variation of tempVariations) {
        await addProductVariation({
          product_id: productResult.data.id,
          variation_name: variation.variation_name,
          color: variation.color || null,
          size: variation.size || null,
          sku: variation.sku,
          stock: variation.stock,
          price: variation.price
        });
      }
    }
    
    resetForm();
  };

  const handleVariationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    const variationData = {
      product_id: selectedProduct.id,
      variation_name: variationFormData.variation_name,
      color: variationFormData.color || null,
      size: variationFormData.size || null,
      sku: variationFormData.sku,
      stock: parseInt(variationFormData.stock),
      price: variationFormData.price ? parseFloat(variationFormData.price) : null,
      image_url: variationImagePreview
    };

    if (editingVariation) {
      await updateProductVariation(editingVariation.id, variationData, variationImageFile || undefined);
    } else {
      await addProductVariation(variationData, variationImageFile || undefined);
    }
    
    resetVariationForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Sem estoque', color: 'text-red-600 bg-red-50' };
    if (stock <= minStock) return { label: 'Estoque baixo', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Em estoque', color: 'text-green-600 bg-green-50' };
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
          {filteredProducts.map((product) => {
            const variations = getVariationsForProduct(product.id);
            const stockStatus = getStockStatus(product.stock, product.min_stock);
            const canAddVariation = usageStatus.canAdd.variationsForProduct(product.id);
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-100 overflow-hidden">
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
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</span>
                        <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                    <span className="text-sm text-gray-600">{product.stock} unidades</span>
                  </div>

                  {/* Variations Info */}
                  {variations.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          {variations.length} variação(ões)
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowVariationsModal(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver todas
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {variations.slice(0, 3).map((variation) => (
                          <span key={variation.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {variation.variation_name}
                          </span>
                        ))}
                        {variations.length > 3 && (
                          <span className="text-xs text-blue-600">+{variations.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        disabled={false}
                        className={`p-2 rounded-lg transition-colors ${
                          usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Editar produto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        disabled={false}
                        className={`p-2 rounded-lg transition-colors ${
                          usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleAddVariation(product)}
                      disabled={!usageStatus.canAdd.variationsForProduct(selectedProduct.id)}
                      className={`flex items-center px-3 py-1 text-xs rounded-lg transition-colors ${
                        usageStatus.canAdd.variationsForProduct(selectedProduct.id)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={
                        !usageStatus.canAdd.variationsForProduct(selectedProduct.id)
                          ? `Limite de ${usageStatus.limits.variationsPerProduct} variações atingido`
                          : 'Adicionar variação'
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Variação
                    </button>
                  </div>
                </div>
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
            
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
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
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                    </div>
                  </div>
                </div>

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

                <div className="grid grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mín.</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
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

                {/* Variações Section - Only for new products */}
                {!editingProduct && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Variações do Produto (Opcional)</label>
                      <button
                        type="button"
                        onClick={() => setShowVariationsInForm(!showVariationsInForm)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showVariationsInForm ? 'Ocultar' : 'Adicionar Variações'}
                      </button>
                    </div>
                    
                    {showVariationsInForm && (
                      <div className="space-y-4">
                        {/* Add Variation Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (tempVariations.length >= usageStatus.limits.variationsPerProduct) {
                              setShowUpgradeModal(true);
                              return;
                            }
                            const newVariation = {
                              id: `temp-${Date.now()}`,
                              variation_name: '',
                              color: '',
                              size: '',
                              sku: '',
                              stock: 0,
                              price: null,
                              image_url: null
                            };
                            setTempVariations([...tempVariations, newVariation]);
                          }}
                          disabled={tempVariations.length >= usageStatus.limits.variationsPerProduct}
                          className={`w-full py-2 px-4 border-2 border-dashed rounded-lg transition-colors ${
                            tempVariations.length < usageStatus.limits.variationsPerProduct
                              ? 'border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50'
                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-4 h-4 mr-2 inline" />
                          Adicionar Variação
                          {!usageStatus.isSubscriptionActive && (
                            <span className="ml-2 text-xs">
                              (Máximo {usageStatus.limits.variationsPerProduct})
                            </span>
                          )}
                        </button>
                        
                        {/* Temporary Variations List */}
                        {tempVariations.map((variation, index) => (
                          <div key={variation.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome da Variação</label>
                                <input
                                  type="text"
                                  value={variation.variation_name}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].variation_name = e.target.value;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ex: Azul - M"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                                <input
                                  type="text"
                                  value={variation.sku}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].sku = e.target.value;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="SKU único"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Cor</label>
                                <input
                                  type="text"
                                  value={variation.color}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].color = e.target.value;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ex: Azul"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tamanho</label>
                                <input
                                  type="text"
                                  value={variation.size}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].size = e.target.value;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ex: M, G"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Estoque</label>
                                <input
                                  type="number"
                                  value={variation.stock}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].stock = parseInt(e.target.value) || 0;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex-1 mr-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Preço (opcional)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variation.price || ''}
                                  onChange={(e) => {
                                    const updated = [...tempVariations];
                                    updated[index].price = e.target.value ? parseFloat(e.target.value) : null;
                                    setTempVariations(updated);
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Usar preço do produto"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = tempVariations.filter((_, i) => i !== index);
                                  setTempVariations(updated);
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Remover variação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {tempVariations.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">Nenhuma variação adicionada</p>
                            <p className="text-xs">Clique em "Adicionar Variação" para começar</p>
                          </div>
                        )}
                      </div>
                    )}
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

      {/* Variations Modal */}
      {showVariationsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowVariationsModal(false)}></div>
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Variações de {selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    Gerencie as variações deste produto
                    {!usageStatus.isSubscriptionActive && (
                      <span className="text-amber-600 font-medium">
                        {' '}(Limite: {usageStatus.limits.variationsPerProduct} variações por produto)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddVariation(selectedProduct)}
                    disabled={!usageStatus.canAdd.variationsForProduct(selectedProduct.id) && !usageStatus.isSubscriptionActive}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      usageStatus.canAdd.variationsForProduct(selectedProduct.id) || usageStatus.isSubscriptionActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Variação
                  </button>
                  <button onClick={() => setShowVariationsModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Variations Limit Warning for Free Users */}
              {!usageStatus.isSubscriptionActive && getVariationsForProduct(selectedProduct.id).length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center">
                    <Crown className="w-5 h-5 text-amber-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Plano Gratuito: Máximo {usageStatus.limits.variationsPerProduct} variações por produto
                      </p>
                    </div>
                    {!usageStatus.canAdd.variationsForProduct(selectedProduct.id) && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition-colors"
                      >
                        Assinar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Variations List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {getVariationsForProduct(selectedProduct.id).map((variation) => (
                  <div key={variation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {variation.image_url ? (
                          <img src={variation.image_url} alt={variation.variation_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{variation.variation_name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {variation.color && <p>Cor: {variation.color}</p>}
                          {variation.size && <p>Tamanho: {variation.size}</p>}
                          <p>SKU: {variation.sku}</p>
                          <p>Estoque: {variation.stock} unidades</p>
                          <p>Preço: {variation.price ? formatCurrency(variation.price) : 'Usar preço do produto'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVariation(variation)}
                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Editar variação"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteVariationConfirm(variation.id)}
                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir variação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {getVariationsForProduct(selectedProduct.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma variação cadastrada</p>
                    <p className="text-sm">Adicione variações como cores, tamanhos, etc.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Variation Modal */}
      {showAddVariationForm && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetVariationForm}></div>
            
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingVariation ? 'Editar Variação' : 'Nova Variação'}
                </h3>
                <button onClick={resetVariationForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleVariationSubmit} className="space-y-4">
                {/* Variation Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem da Variação</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {variationImagePreview ? (
                        <img src={variationImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Escolher Imagem
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVariationImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                    </div>
                  </div>
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor (opcional)</label>
                    <input
                      type="text"
                      value={variationFormData.color}
                      onChange={(e) => setVariationFormData({...variationFormData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Azul"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (opcional)</label>
                    <input
                      type="text"
                      value={variationFormData.size}
                      onChange={(e) => setVariationFormData({...variationFormData, size: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: M, G, 42"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variationFormData.price}
                    onChange={(e) => setVariationFormData({...variationFormData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Deixe vazio para usar ${formatCurrency(selectedProduct.price)}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se não informado, será usado o preço do produto principal: {formatCurrency(selectedProduct.price)}
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
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
                Tem certeza que deseja remover este produto? Todas as informações e variações serão perdidas permanentemente.
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
                  Remover Produto
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
                Tem certeza que deseja remover esta variação? Todas as informações serão perdidas permanentemente.
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
                  Remover Variação
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
        title={usageStatus.isLimitReached.products ? "Você atingiu o limite gratuito de 5 registros nesta seção" : "Limite de variações atingido"}
        message={usageStatus.isLimitReached.products ? "Faça upgrade para o plano pago para continuar adicionando." : "No plano gratuito você pode adicionar até 3 variações por produto. Assine para ter variações ilimitadas."}
      />
    </div>
  );
};