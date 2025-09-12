import React, { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Crown, CheckCircle, AlertCircle, X, Palette, Ruler, DollarSign, Upload, Camera, Image } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { ProductVariation } from '../lib/supabase';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading, addProductVariation, updateProductVariation, deleteProductVariation, getVariationsForProduct, uploadProductImage } = useSupabaseData();
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variationImages, setVariationImages] = useState<Map<number, { file: File; preview: string }>>(new Map());

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
    setSelectedImage(null);
    setImagePreview(null);
    setVariationImages(new Map());
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVariationImageSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setVariationImages(new Map(variationImages.set(index, { file, preview })));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const removeVariationImage = (index: number) => {
    const newMap = new Map(variationImages);
    newMap.delete(index);
    setVariationImages(newMap);
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
      result = await updateProduct(editingProduct.id, productData, selectedImage || undefined);
    } else {
      result = await addProduct(productData, selectedImage || undefined);
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
          const variationIndex = productVariationsFormData.indexOf(variation);
          const variationImageData = variationImages.get(variationIndex);
          
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
            }, variationImageData?.file);
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
    
    // Set existing product image preview if available
    if (product.image_url) {
      setImagePreview(product.image_url);
    }
    
    setProductVariationsFormData(existingVariations.map(v => ({
      variation_name: v.variation_name,
      color: v.color,
      size: v.size,
      sku: v.sku,
      stock: v.stock,
      price: v.price
    })));
    
    // Set existing variation image previews
    const newVariationImages = new Map();
    existingVariations.forEach((variation, index) => {
      if (variation.image_url) {
        newVariationImages.set(index, { file: null, preview: variation.image_url });
      }
    });
    setVariationImages(newVariationImages);
    
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
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
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
                <div className="flex items-center space