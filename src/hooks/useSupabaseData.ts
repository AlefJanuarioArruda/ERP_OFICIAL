import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Product, Customer, Sale, SaleItem, FinancialRecord, AIInsight, ProductVariation } from '../lib/supabase'

export const useSupabaseData = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([])
  const [productVariations, setProductVariations] = useState<ProductVariation[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [dataFetchError, setDataFetchError] = useState<string | null>(null)

  // Fetch all user data
  const fetchUserData = async () => {
    if (!user) {
      setLoading(false)
      setDataFetchError(null)
      return
    }

    setLoading(true)
    setDataFetchError(null)
    
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch sale items
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch financial records
      const { data: financialData } = await supabase
        .from('financial_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch AI insights
      const { data: insightsData } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch product variations
      const { data: productVariationsData } = await supabase
        .from('product_variations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
      setCustomers(customersData || [])
      setSales(salesData || [])
      setSaleItems(saleItemsData || [])
      setFinancialRecords(financialData || [])
      setProductVariations(productVariationsData || [])
      setAiInsights(insightsData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
      setDataFetchError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when user changes
  useEffect(() => {
    fetchUserData()
  }, [user])

  // Product operations
  const uploadProductImage = async (file: File, productId?: string): Promise<{ url: string | null; error: any }> => {
    if (!user) return { url: null, error: 'User not authenticated' }

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { url: null, error: 'Imagem muito grande. Máximo 5MB.' }
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { url: null, error: 'Por favor, selecione uma imagem válida.' }
      }

      const fileExtension = file.name.split('.').pop()
      const fileName = `${user.id}/${productId || 'product'}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase Storage upload error:', error)
        return { url: null, error: `Erro ao fazer upload da imagem: ${error.message}` }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return { url: null, error: 'Erro ao obter URL pública da imagem.' }
      }

      return { url: publicUrlData.publicUrl, error: null }
    } catch (error) {
      console.error('Image upload error:', error)
      return { url: null, error: 'Erro inesperado ao fazer upload da imagem' }
    }
  }

  const deleteProductImage = async (imageUrl: string): Promise<{ error: any }> => {
    if (!user) return { error: 'User not authenticated' }

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([fileName])

      return { error }
    } catch (error) {
      console.error('Image delete error:', error)
      return { error: 'Erro ao excluir imagem' }
    }
  }

  const addProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>, imageFile?: File) => {
    if (!user) return

    let imageUrl = null
    
    // Upload image if provided
    if (imageFile) {
      const uploadResult = await uploadProductImage(imageFile)
      if (uploadResult.error) {
        return { data: null, error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        image_url: imageUrl,
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setProducts(prev => [data, ...prev])
      
      // Generate AI insight for new product
      await generateProductInsight(data)
    }

    return { data, error }
  }

  const updateProduct = async (id: string, updates: Partial<Product>, imageFile?: File) => {
    if (!user) return

    console.log('🔄 Iniciando atualização de produto:', {
      product_id: id,
      user_id: user.id,
      updates: updates
    })

    let imageUrl = updates.image_url
    
    // Handle image upload if new file provided
    if (imageFile) {
      // Delete old image if exists
      const currentProduct = products.find(p => p.id === id)
      if (currentProduct?.image_url) {
        await deleteProductImage(currentProduct.image_url)
      }
      
      // Upload new image
      const uploadResult = await uploadProductImage(imageFile, id)
      if (uploadResult.error) {
        return { data: null, error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          image_url: imageUrl
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase ao atualizar produto:', error)
        return { data: null, error: error.message || 'Erro ao atualizar produto' }
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado após atualização do produto')
        return { data: null, error: 'Nenhum produto foi atualizado' }
      }

      console.log('✅ Produto atualizado com sucesso:', {
        product_id: data.id,
        name: data.name,
        new_stock: data.stock
      })

      setProducts(prev => prev.map(p => p.id === id ? data : p))
      
      // Check if stock was updated and resolve insights if needed
      if (updates.stock !== undefined) {
        await checkAndResolveStockInsights(id, updates.stock);
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar produto:', error)
      return { data: null, error: 'Erro inesperado ao atualizar produto' }
    }
  }

  const deleteProduct = async (id: string) => {
    if (!user) return

    // Delete product image if exists
    const product = products.find(p => p.id === id)
    if (product?.image_url) {
      await deleteProductImage(product.image_url)
    }
    
    // Delete variation images
    const variations = getVariationsForProduct(id)
    for (const variation of variations) {
      if (variation.image_url) {
        await deleteProductImage(variation.image_url)
      }
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }

    return { error }
  }

  // Product Variation operations
  const addProductVariation = async (variationData: Omit<ProductVariation, 'id' | 'user_id' | 'created_at' | 'updated_at'>, imageFile?: File) => {
    if (!user) return

    let imageUrl = variationData.image_url || null
    
    // Upload image if provided
    if (imageFile) {
      const uploadResult = await uploadProductImage(imageFile, `variation-${variationData.product_id}-${Date.now()}`)
      if (uploadResult.error) {
        return { data: null, error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    }

    const { data, error } = await supabase
      .from('product_variations')
      .insert({
        ...variationData,
        image_url: imageUrl,
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setProductVariations(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateProductVariation = async (id: string, updates: Partial<ProductVariation>, imageFile?: File) => {
    if (!user) return

    console.log('🔄 Iniciando atualização de variação de produto:', {
      variation_id: id,
      user_id: user.id,
      updates: updates
    })

    let imageUrl = updates.image_url
    
    // Handle image upload if new file provided
    if (imageFile) {
      // Delete old image if exists
      const currentVariation = productVariations.find(v => v.id === id)
      if (currentVariation?.image_url) {
        await deleteProductImage(currentVariation.image_url)
      }
      
      // Upload new image
      const uploadResult = await uploadProductImage(imageFile, `variation-${id}-${Date.now()}`)
      if (uploadResult.error) {
        return { data: null, error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    }

    try {
      const { data, error } = await supabase
        .from('product_variations')
        .update({
          ...updates,
          image_url: imageUrl
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase ao atualizar variação:', error)
        return { data: null, error: error.message || 'Erro ao atualizar variação' }
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado após atualização da variação')
        return { data: null, error: 'Nenhuma variação foi atualizada' }
      }

      console.log('✅ Variação atualizada com sucesso:', {
        variation_id: data.id,
        name: data.variation_name,
        new_stock: data.stock
      })

      setProductVariations(prev => prev.map(v => v.id === id ? data : v))
      return { data, error: null }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar variação:', error)
      return { data: null, error: 'Erro inesperado ao atualizar variação' }
    }
  }

  const deleteProductVariation = async (id: string) => {
    if (!user) return

    // Delete variation image if exists
    const variation = productVariations.find(v => v.id === id)
    if (variation?.image_url) {
      await deleteProductImage(variation.image_url)
    }

    const { error } = await supabase
      .from('product_variations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setProductVariations(prev => prev.filter(v => v.id !== id))
    }

    return { error }
  }

  // Helper to get variations for a specific product
  const getVariationsForProduct = (productId: string) => {
    return productVariations.filter(v => v.product_id === productId);
  };

  // Update product stock based on variations
 const updateProductStockFromVariations = async (productId: string) => {
  if (!user) return;
  const variations = getVariationsForProduct(productId);
  const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
  await updateProduct(productId, { stock: totalStock });
};

  // Update product price based on variations (e.g., min price)
  const updateProductPriceFromVariations = async (productId: string) => {
    if (!user) return;
    const variations = getVariationsForProduct(productId);
    const minPrice = variations.length > 0 ? Math.min(...variations.map(v => v.price || 0)) : 0;
    await updateProduct(productId, { price: minPrice });
  };

  // Customer operations
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'user_id' | 'total_purchases' | 'last_purchase' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        user_id: user.id,
        total_purchases: 0
      })
      .select()
      .single()

    if (!error && data) {
      setCustomers(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error && data) {
      setCustomers(prev => prev.map(c => c.id === id ? data : c))
    }

    return { data, error }
  }

  const deleteCustomer = async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setCustomers(prev => prev.filter(c => c.id !== id))
    }

    return { error }
  }

  
  // Sale operations
  const addSale = async (saleData: {
    customer_id: string | null
    customer_name: string
    items: Array<{
      product_id: string | null
      product_name: string
      quantity: number
    variation_id?: string | null
      unit_price: number
      total: number
    }>
    total: number
    subtotal: number
    discount: number
    tax: number
    payment_method: 'pix' | 'boleto' | 'card' | 'cash'
    payment_status: 'pending' | 'paid' | 'overdue'
    due_date?: string
    total_cost?: number
  }) => {
    if (!user) return

    console.log('🚀 Iniciando processo de venda:', {
      customer: saleData.customer_name,
      items_count: saleData.items.length,
      total: saleData.total,
      total_cost: saleData.total_cost
    })

    // Validação de estoque ANTES de criar a venda
    console.log('📦 Validando estoque antes da venda...')
    for (const item of saleData.items) {
      // Se é uma variação, validar estoque da variação
      if (item.variation_id) {
        const variation = productVariations.find(v => v.id === item.variation_id)
        if (!variation) {
          console.error(`❌ Variação não encontrada: ${item.variation_id}`)
          return { data: null, error: `Variação ${item.product_name} não encontrada` }
        }
        
        if (variation.stock < item.quantity) {
          console.error(`❌ Estoque insuficiente para variação ${variation.variation_name}:`, {
            disponivel: variation.stock,
            solicitado: item.quantity
          })
          return { 
            data: null, 
            error: `Estoque insuficiente para ${variation.variation_name}. Disponível: ${variation.stock}, Solicitado: ${item.quantity}` 
          }
        }
        continue
      }
      
      // Se é um produto principal, validar estoque do produto
      if (!item.product_id) continue
      
      const product = products.find(p => p.id === item.product_id)
      if (!product) {
        console.error(`❌ Produto não encontrado: ${item.product_id}`)
        return { data: null, error: `Produto ${item.product_name} não encontrado` }
      }
      
      if (product.stock < item.quantity) {
        console.error(`❌ Estoque insuficiente para ${product.name}:`, {
          disponivel: product.stock,
          solicitado: item.quantity
        })
        return { 
          data: null, 
          error: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}` 
        }
      }
    }
    console.log('✅ Validação de estoque concluída - todos os produtos têm estoque suficiente')

    // Helper function to validate UUID format
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }

    // Generate invoice number
    const invoiceNumber = `INV-${user.id.slice(0, 8)}-${String(sales.length + 1).padStart(3, '0')}`
    console.log('📄 Número da fatura gerado:', invoiceNumber)

    // Insert sale
    console.log('💾 Inserindo venda no banco de dados...')
    const { data: saleRecord, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        customer_id: saleData.customer_id,
        customer_name: saleData.customer_name,
        total: saleData.total,
        subtotal: saleData.subtotal,
        discount: saleData.discount,
        tax: saleData.tax,
        status: 'completed',
        payment_method: saleData.payment_method,
        payment_status: saleData.payment_status,
        invoice_number: invoiceNumber,
        due_date: saleData.due_date
      })
      .select()
      .single()

    if (saleError || !saleRecord) {
      console.error('❌ Erro ao inserir venda:', saleError)
      return { data: null, error: saleError }
    }
    console.log('✅ Venda inserida com sucesso:', saleRecord.id)

    // Insert sale items
    console.log('📝 Inserindo itens da venda...')
    const saleItemsToInsert = saleData.items.map(item => ({
      user_id: user.id,
      sale_id: saleRecord.id,
      product_id: (() => {
        if (!item.product_id) return null;
        
        // Extract main product ID if it's a variation (contains hyphen)
        const extractedId = item.product_id.includes('-') ? item.product_id.split('-')[0] : item.product_id;
        
        // Validate UUID format
        return isValidUUID(extractedId) ? extractedId : null;
      })(),
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total
    }))

    const { data: itemsData, error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsToInsert)
      .select()

    if (!itemsError) {
      setSaleItems(prev => [...(itemsData || []), ...prev])
      console.log('✅ Itens da venda inseridos com sucesso')
    } else {
      console.error('❌ Erro ao inserir itens da venda:', itemsError)
    }

    // Atualizar estoque dos produtos vendidos
    console.log('📦 Iniciando atualização de estoque para', saleData.items.length, 'itens...')
    
    for (const item of saleData.items) {
      // Se é uma variação, atualizar estoque da variação
      if (item.variation_id) {
        console.log(`📦 Processando variação: ${item.product_name} (Variation ID: ${item.variation_id})`)
        
        const variation = productVariations.find(v => v.id === item.variation_id)
        if (!variation) {
          console.error(`❌ Variação não encontrada para atualização de estoque: ${item.variation_id}`)
          continue
        }

        const newVariationStock = Math.max(variation.stock - item.quantity, 0)
        console.log(`📦 Atualizando estoque da variação ${variation.variation_name}:`, {
          estoque_anterior: variation.stock,
          quantidade_vendida: item.quantity,
          novo_estoque: newVariationStock
        })

        try {
          const updateResult = await updateProductVariation(item.variation_id, { stock: newVariationStock })
          if (updateResult?.error) {
            console.error(`❌ Erro ao atualizar estoque da variação ${variation.variation_name}:`, updateResult.error)
          } else {
            console.log(`✅ Estoque da variação atualizado com sucesso para ${variation.variation_name}`)
          }
        } catch (error) {
          console.error(`❌ Erro inesperado ao atualizar estoque da variação ${variation.variation_name}:`, error)
        }
        continue
      }
      
      // Se é um produto principal, atualizar estoque do produto
      if (!item.product_id) {
        console.warn('⚠️ Item sem product_id:', item.product_name)
        continue
      }

      console.log(`📦 Processando produto principal: ${item.product_name} (ID: ${item.product_id})`)
      
      const product = products.find(p => p.id === item.product_id)
      if (!product) {
        console.error(`❌ Produto não encontrado para atualização de estoque: ${item.product_id}`)
        continue
      }

      const newStock = Math.max(product.stock - item.quantity, 0)
      console.log(`📦 Atualizando estoque de ${product.name}:`, {
        estoque_anterior: product.stock,
        quantidade_vendida: item.quantity,
        novo_estoque: newStock
      })

      try {
        const updateResult = await updateProduct(item.product_id, { stock: newStock })
        if (updateResult?.error) {
          console.error(`❌ Erro ao atualizar estoque do produto ${product.name}:`, updateResult.error)
        } else {
          console.log(`✅ Estoque atualizado com sucesso para ${product.name}`)
        }
      } catch (error) {
        console.error(`❌ Erro inesperado ao atualizar estoque do produto ${product.name}:`, error)
      }
    }
    
    console.log('✅ Atualização de estoque concluída')

    // Criar registro de despesa baseado no custo dos produtos vendidos
    if (saleData.total_cost && saleData.total_cost > 0) {
      console.log('💰 Criando registro de despesa para custo dos produtos vendidos:', saleData.total_cost)
      
      const expenseData = {
        type: 'expense' as const,
        category: 'Custo dos Produtos Vendidos',
        amount: saleData.total_cost,
        description: `Custo dos produtos vendidos - ${saleData.customer_name} (${invoiceNumber})`,
        status: 'paid' as const,
        due_date: new Date().toISOString(),
        paid_date: new Date().toISOString(),
        customer_id: saleData.customer_id,
        sale_id: saleRecord.id
      }
      
      try {
        const expenseResult = await addFinancialRecord(expenseData)
        if (expenseResult?.error) {
          console.error('❌ Erro ao criar registro de despesa:', expenseResult.error)
        } else {
          console.log('✅ Registro de despesa criado com sucesso')
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao criar registro de despesa:', error)
      }
    }

    // Update customer total purchases (only if customer is selected)
    if (saleData.customer_id) {
      console.log('👤 Atualizando total de compras do cliente...')
      const customer = customers.find(c => c.id === saleData.customer_id)
      if (customer) {
        const customerUpdateResult = await supabase
          .from('customers')
          .update({
            total_purchases: customer.total_purchases + saleData.total,
            last_purchase: new Date().toISOString()
          })
          .eq('id', saleData.customer_id)
          .eq('user_id', user.id)
        
        if (customerUpdateResult.error) {
          console.error('❌ Erro ao atualizar dados do cliente:', customerUpdateResult.error)
        } else {
          console.log('✅ Dados do cliente atualizados com sucesso')
        }
      }
    }

    // Create financial record
    console.log('💰 Criando registro financeiro de receita...')
    await addFinancialRecord({
      type: 'income',
      category: 'Vendas',
      amount: saleData.total,
      description: `Venda - ${saleData.customer_name}`,
      status: saleData.payment_status,
      due_date: saleData.due_date || new Date().toISOString(),
      paid_date: saleData.payment_status === 'paid' ? new Date().toISOString() : null,
      customer_id: saleData.customer_id,
      sale_id: saleRecord.id
    })

    setSales(prev => [saleRecord, ...prev])
    
    // Generate AI insights
    console.log('🤖 Gerando insights de IA...')
    await generateSaleInsight(saleRecord, saleData.items)

    // Forçar atualização de todos os dados para garantir que as mudanças sejam refletidas
    console.log('🔄 Atualizando todos os dados do usuário...')
    await fetchUserData()
    console.log('✅ Processo de venda concluído com sucesso!')
    
    return { data: saleRecord, error: null }
  }

  // Financial operations
  const addFinancialRecord = async (recordData: Omit<FinancialRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        ...recordData,
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setFinancialRecords(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateFinancialRecord = async (id: string, updates: Partial<FinancialRecord>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('financial_records')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error && data) {
      setFinancialRecords(prev => prev.map(r => r.id === id ? data : r))
    }

    return { data, error }
  }

  const deleteFinancialRecord = async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from('financial_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setFinancialRecords(prev => prev.filter(r => r.id !== id))
    }

    return { error }
  }

  // AI Insights operations
  const markInsightAsRead = async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setAiInsights(prev => prev.map(insight =>
        insight.id === id ? { ...insight, is_read: true } : insight
      ))
    }
  }

  // Generate AI insights
  const generateProductInsight = async (product: Product) => {
    if (!user) return

    const insight = {
      user_id: user.id,
      type: 'recommendation' as const,
      title: 'Novo Produto Adicionado',
      description: `O produto "${product.name}" foi adicionado ao seu catálogo. Considere criar uma campanha de lançamento.`,
      priority: 'medium' as const,
      category: 'inventory' as const,
      data: { product_id: product.id },
      is_read: false
    }

    const { data } = await supabase
      .from('ai_insights')
      .insert(insight)
      .select()
      .single()

    if (data) {
      setAiInsights(prev => [data, ...prev])
    }
  }

  const generateSaleInsight = async (sale: Sale, items: any[]) => {
    if (!user) return

    const insight = {
      user_id: user.id,
      type: 'summary' as const,
      title: 'Nova Venda Realizada',
      description: `Venda de R$ ${sale.total.toFixed(2)} realizada para ${sale.customer_name}. Continue assim!`,
      priority: 'low' as const,
      category: 'sales' as const,
      data: { sale_id: sale.id, amount: sale.total },
      is_read: false
    }

    const { data } = await supabase
      .from('ai_insights')
      .insert(insight)
      .select()
      .single()

    if (data) {
      setAiInsights(prev => [data, ...prev])
    }

    // Check for low stock and generate insights
    for (const item of items) {
      if (!item.product_id) continue;
      
      if (item.variation_id) {
        // Check variation stock
        const variation = productVariations.find(v => v.id === item.variation_id);
        if (variation) {
          const newStock = variation.stock - item.quantity;
          
          if (newStock <= 1) { // Low stock threshold for variations
            const existingInsight = aiInsights.find(insight => 
              insight.category === 'inventory' && 
              insight.data?.variation_id === item.variation_id &&
              !insight.is_read
            );
            
            if (!existingInsight) {
              const lowStockInsight = {
                user_id: user.id,
                type: 'alert' as const,
                title: 'Estoque Baixo de Variação',
                description: `A variação "${variation.variation_name}" do produto "${item.product_name}" ficou com estoque baixo após a venda.`,
                priority: 'high' as const,
                category: 'inventory' as const,
                data: { product_id: item.product_id, variation_id: item.variation_id, current_stock: newStock },
                is_read: false
              };

              const { data: lowStockData } = await supabase
                .from('ai_insights')
                .insert(lowStockInsight)
                .select()
                .single();

              if (lowStockData) {
                setAiInsights(prev => [lowStockData, ...prev]);
              }
            }
          }
        }
      } else {
        // Check main product stock
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newStock = product.stock - item.quantity;
          
          if (newStock <= product.min_stock) {
            const existingInsight = aiInsights.find(insight => 
              insight.category === 'inventory' && 
              insight.data?.product_id === item.product_id &&
              !insight.is_read
            );
            
            if (!existingInsight) {
              const lowStockInsight = {
                user_id: user.id,
                type: 'alert' as const,
                title: 'Estoque Baixo Após Venda',
                description: `O produto "${item.product_name}" ficou com estoque baixo após a venda. Considere reabastecer.`,
                priority: 'high' as const,
                category: 'inventory' as const,
                data: { product_id: item.product_id, current_stock: newStock },
                is_read: false
              };

              const { data: lowStockData } = await supabase
                .from('ai_insights')
                .insert(lowStockInsight)
                .select()
                .single();

              if (lowStockData) {
                setAiInsights(prev => [lowStockData, ...prev]);
              }
            }
          }
        }
      }
    }
  }

  // Auto-resolve low stock insights when product is restocked
  const checkAndResolveStockInsights = async (productId: string, newStock: number) => {
    if (!user) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // If stock is now above minimum, mark related low stock insights as read
    if (newStock > product.min_stock) {
      const lowStockInsights = aiInsights.filter(insight => 
        insight.category === 'inventory' && 
        insight.data?.product_id === productId &&
        !insight.is_read &&
        insight.title.includes('Estoque Baixo')
      );
      
      for (const insight of lowStockInsights) {
        await supabase
          .from('ai_insights')
          .update({ is_read: true })
          .eq('id', insight.id)
          .eq('user_id', user.id);
        
        // Update local state
        setAiInsights(prev => prev.map(i => 
          i.id === insight.id ? { ...i, is_read: true } : i
        ));
      }
    } else if (newStock <= product.min_stock) {
      // If stock is still low or became low, check if we need to create a new alert
      const existingInsight = aiInsights.find(insight => 
        insight.category === 'inventory' && 
        insight.data?.product_id === productId &&
        !insight.is_read &&
        insight.title.includes('Estoque Baixo')
      );
      
      // Only create new insight if one doesn't exist
      if (!existingInsight) {
        const lowStockInsight = {
          user_id: user.id,
          type: 'alert' as const,
          title: 'Produto com Estoque Baixo',
          description: `O produto "${product.name}" está com estoque baixo (${newStock} unidades). Considere reabastecer.`,
          priority: 'high' as const,
          category: 'inventory' as const,
          data: { product_id: productId, current_stock: newStock },
          is_read: false
        };

        const { data: lowStockData } = await supabase
          .from('ai_insights')
          .insert(lowStockInsight)
          .select()
          .single();

        if (lowStockData) {
          setAiInsights(prev => [lowStockData, ...prev]);
        }
      }
    }
  };

  // Calculate dashboard metrics
  const getDashboardMetrics = () => {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    
    // Current month data
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= currentMonth
    })
    
    const currentMonthFinancial = financialRecords.filter(record => {
      const recordDate = new Date(record.created_at)
      return recordDate >= currentMonth
    })
    
    // Previous month data
    const lastMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= lastMonth && saleDate < currentMonth
    })
    
    const lastMonthFinancial = financialRecords.filter(record => {
      const recordDate = new Date(record.created_at)
      return recordDate >= lastMonth && recordDate < currentMonth
    })
    
    // Calculate current month metrics
    const currentRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0)
    const currentIncome = currentMonthFinancial
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)
    const currentExpenses = currentMonthFinancial
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)
    const currentSalesCount = currentMonthSales.length
    
    // Calculate previous month metrics
    const previousRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total, 0)
    const previousIncome = lastMonthFinancial
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)
    const previousExpenses = lastMonthFinancial
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)
    const previousSalesCount = lastMonthSales.length
    
    // Calculate changes (percentage)
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }
    
    const currentProfit = currentIncome - currentExpenses
    const previousProfit = previousIncome - previousExpenses

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: calculateChange(currentRevenue, previousRevenue)
      },
      profit: {
        current: currentProfit,
        previous: previousProfit,
        change: calculateChange(currentProfit, previousProfit)
      },
      expenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: calculateChange(currentExpenses, previousExpenses)
      },
      sales: {
        current: currentSalesCount,
        previous: previousSalesCount,
        change: calculateChange(currentSalesCount, previousSalesCount)
      }
    }
  }

  // Get sales with items
  const getSalesWithItems = () => {
    return sales.map(sale => ({
      ...sale,
      items: saleItems.filter(item => item.sale_id === sale.id)
    }))
  }

  return {
    // Data
    products,
    customers,
    sales: getSalesWithItems(),
    financialRecords,
    aiInsights,
    loading,
    dataFetchError,
    
    // Operations
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
    getVariationsForProduct,
    uploadProductImage,
    deleteProductImage,
    addSale,
    addFinancialRecord,
    updateFinancialRecord,
    deleteFinancialRecord,
    markInsightAsRead,
    
    // Computed data
    dashboardMetrics: getDashboardMetrics(),
    
    // Refresh
    refetch: fetchUserData
  }
}