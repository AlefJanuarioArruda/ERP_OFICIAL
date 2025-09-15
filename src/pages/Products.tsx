import React, { useState } from 'react';
import { Plus, Search, Package, Edit, Trash2, Crown, X, Camera, Upload } from 'lucide-react';
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
    uploadProductImage,
    loading 
  } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newVariations, setNewVariations] = useState<Array<{
    id?: string;
    variation_name: string;
    color: string;
    size: string;
    sku: string;
    stock: number;
    price: number;
    image?: File | null;
    imagePreview?: string | null;
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
    setNewVariations([]);
    setShowAddForm(false);
    setEditingProduct(null);
    setSelectedProduct(null);
    setShowUpgradeModal(false);
  };

  const handleAddProduct = () => {
    if (!usageStatus.canAdd.products) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
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

  const handleDelete = async (productId: string) => {
    if (usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    await deleteProduct(productId);
    setShowDeleteConfirm(null);
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

  const handleVariationImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const updated = [...newVariations];
        updated[index] = { 
          ...updated[index], 
          image: file,
          imagePreview: event.target?.result as string 
        };
        setNewVariations(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewVariation = () => {
    setNewVariations([...newVariations, {
      variation_name: '',
      color: '',
      size: '',
      sku: '',
      stock: 0,
      price: 0,
      image: null,
      imagePreview: null
    }]);
  };

  const removeVariation = (index: number) => {
    setNewVariations(newVariations.filter((_, i) => i !== index));
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
      alert(`Erro: ${result.error}`);
      return;
    }

    // Add variations if any
    if (newVariations.length > 0 && result?.data) {
      for (const variation of newVariations) {
        if (variation.variation_name && variation.sku) {
          await addProductVariation({
            product_id: editingProduct?.id || result.data.id,
            variation_name: variation.variation_name,
            color: variation.color || null,
            size: variation.size || null,
            sku: variation.sku,
            stock: variation.stock,
            price: variation.price || null,
            image_url: null
          }, variation.image || undefined);
        }
      }
    }
    
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-200 overflow-hidden">
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>SKU: {product.sku}</span>
                      <span>Categoria: {product.category}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Preço de Venda:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Custo:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(product.cost_price)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estoque:</span>
                    <span className={`font-medium ${product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock} unidades
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Margem:</span>
                    <span className="font-medium text-blue-600">
                      {((product.price - product.cost_price) / product.price * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Stock Alert */}
                {product.stock <= product.min_stock && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">⚠️ Estoque baixo!</p>
                    <p className="text-xs text-red-600">Considere reabastecer este produto</p>
                  </div>
                )}

                {/* Variations */}
                {getVariationsForProduct(product.id).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Variações:</h4>
                    <div className="space-y-2">
                      {getVariationsForProduct(product.id).filter(variation => variation != null).map((variation) => (
                        <div key={variation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{variation.variation_name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              {variation.color && <span>Cor: {variation.color}</span>}
                              {variation.size && <span>Tamanho: {variation.size}</span>}
                              <span>Estoque: {variation.stock}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(variation.price || product.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    disabled={false}
                    className={`px-3 py-2 rounded-lg transition-colors ${
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
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      usageStatus.isLimitReached.products && !usageStatus.isSubscriptionActive
                        ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title="Remover produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
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

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedProduct(null)}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Produto</h3>
                <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <p className="font-medium">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Categoria:</span>
                      <p className="font-medium">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Fornecedor:</span>
                      <p className="font-medium">{selectedProduct.supplier || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estoque:</span>
                      <p className={`font-medium ${selectedProduct.stock <= selectedProduct.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
                        {selectedProduct.stock} unidades
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600 text-sm">Preço de Venda:</span>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(selectedProduct.price)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Custo:</span>
                        <p className="text-lg font-medium text-gray-900">{formatCurrency(selectedProduct.cost_price)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-gray-600 text-sm">Margem de Lucro:</span>
                      <p className="text-lg font-bold text-blue-600">
                        {((selectedProduct.price - selectedProduct.cost_price) / selectedProduct.price * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variations */}
              {getVariationsForProduct(selectedProduct.id).length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Variações do Produto</h4>
                  <div className="space-y-3">
                    {getVariationsForProduct(selectedProduct.id).filter(variation => variation != null).map((variation) => (
                      <div key={variation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {/* Variation Image */}
                          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                            {variation.image_url ? (
                              <img
                                src={variation.image_url}
                                alt={variation.variation_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Variation Info */}
                          <div>
                            <p className="font-medium text-gray-900">{variation.variation_name}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              {variation.color && <span>Cor: {variation.color}</span>}
                              {variation.size && <span>Tamanho: {variation.size}</span>}
                              <span>SKU: {variation.sku}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(variation.price || selectedProduct.price)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600">Estoque:</span>
                            <input
                              type="number"
                              min="0"
                              value={variation.stock === 0 ? '' : variation.stock}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newStock = value === '' ? 0 : parseInt(value) || 0;
                                updateProductVariation(variation.id, { stock: newStock });
                              }}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
                        <input
                          type="number"
                          min="0"
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
                          min="0"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Right Column - Image and Variations */}
                  <div className="space-y-6">
                    {/* Product Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-2">Clique para adicionar imagem</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              id="product-image"
                            />
                            <label
                              htmlFor="product-image"
                              className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Escolher Arquivo
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variations Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">Variações do Produto</label>
                        <button
                          type="button"
                          onClick={addNewVariation}
                          className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Variação
                        </button>
                      </div>

                      {/* Existing Variations (when editing) */}
                      {editingProduct && getVariationsForProduct(editingProduct.id).length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Variações Existentes:</h5>
                          <div className="space-y-2">
                            {getVariationsForProduct(editingProduct.id).filter(variation => variation != null).map((variation) => (
                              <div key={variation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {/* Variation Image */}
                                  <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                                    {variation.image_url ? (
                                      <img
                                        src={variation.image_url}
                                        alt={variation.variation_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <Package className="w-3 h-3 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Variation Info */}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{variation.variation_name}</p>
                                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                                      {variation.color && <span>Cor: {variation.color}</span>}
                                      {variation.size && <span>Tamanho: {variation.size}</span>}
                                      <span>SKU: {variation.sku}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{formatCurrency(variation.price || editingProduct.price)}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <span className="text-xs text-gray-600">Estoque:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={variation.stock === 0 ? '' : variation.stock}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const newStock = value === '' ? 0 : parseInt(value) || 0;
                                          updateProductVariation(variation.id, { stock: newStock });
                                        }}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => deleteProductVariation(variation.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    title="Excluir variação"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Variations */}
                      {newVariations.length > 0 && (
                        <div className="space-y-2">
                          {newVariations.filter(variation => variation != null).map((variation, index) => (
                            <div key={variation?.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={variation.variation_name}
                                  onChange={(e) => {
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, variation_name: e.target.value };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Nome da variação (ex: Azul - M)"
                                />
                              </div>
                              <div className="w-24">
                                <input
                                  type="text"
                                  value={variation.color}
                                  onChange={(e) => {
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, color: e.target.value };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Cor"
                                />
                              </div>
                              <div className="w-24">
                                <input
                                  type="text"
                                  value={variation.size}
                                  onChange={(e) => {
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, size: e.target.value };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Tamanho"
                                />
                              </div>
                              <div className="w-24">
                                <input
                                  type="text"
                                  value={variation.sku}
                                  onChange={(e) => {
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, sku: e.target.value };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="SKU"
                                />
                              </div>
                              <div className="w-20">
                                <input
                                  type="number"
                                  min="0"
                                  value={variation.stock === 0 ? '' : variation.stock || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newStock = value === '' ? 0 : parseInt(value) || 0;
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, stock: newStock };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Estoque"
                                />
                              </div>
                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variation.price === 0 ? '' : variation.price || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newPrice = value === '' ? 0 : parseFloat(value) || 0;
                                    const updated = [...newVariations];
                                    updated[index] = { ...variation, price: newPrice };
                                    setNewVariations(updated);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Preço"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariation(index)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Remover variação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
                Tem certeza que deseja remover este produto? Todas as informações serão perdidas permanentemente.
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