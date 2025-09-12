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

  // Fetch all user data
  const fetchUserData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    
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
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when user changes
  useEffect(() => {
    fetchUserData()
  }, [user])

  // Product operations
  const addProduct = async (productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
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

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProducts(prev => prev.map(p => p.id === id ? data : p))
      
      // Check if stock was updated and resolve insights if needed
      if (updates.stock !== undefined) {
        await checkAndResolveStockInsights(id, updates.stock);
      }
    }

    return { data, error }
  }

  const deleteProduct = async (id: string) => {
    if (!user) return

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
  const addProductVariation = async (variationData: Omit<ProductVariation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('product_variations')
      .insert({
        ...variationData,
        user_id: user.id
      })
      .select()
      .single()

    if (!error && data) {
      setProductVariations(prev => [data, ...prev])
    }

    return { data, error }
  }

  const updateProductVariation = async (id: string, updates: Partial<ProductVariation>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('product_variations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProductVariations(prev => prev.map(v => v.id === id ? data : v))
    }

    return { data, error }
  }

  const deleteProductVariation = async (id: string) => {
    if (!user) return

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
    const totalStock = variations.reduce((sum, v) => sum + v.stock, 0);
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
  }) => {
    if (!user) return

    // Helper function to validate UUID format
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    }

    // Generate invoice number
    const invoiceNumber = `INV-${user.id.slice(0, 8)}-${String(sales.length + 1).padStart(3, '0')}`

    // Insert sale
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
      return { data: null, error: saleError }
    }

    // Insert sale items
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
    }

    // Update product stock and variation stock
    for (const item of saleData.items) {
      if (item.product_id) {
        // Check if it's a variation (contains hyphen)
        if (item.product_id.includes('-')) {
          const [productId, variationId] = item.product_id.split('-');
          const variation = productVariations.find(v => v.id === variationId);
          if (variation) {
            await updateProductVariation(variationId, {
              stock: variation.stock - item.quantity
            });
            // Also update main product stock
            await updateProductStockFromVariations(productId);
          }
        } else {
          // Regular product
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            await updateProduct(item.product_id, {
              stock: product.stock - item.quantity
            });
          }
        }
      }
    }

    // Update customer total purchases (only if customer is selected)
    if (saleData.customer_id) {
      const customer = customers.find(c => c.id === saleData.customer_id)
      if (customer) {
        await supabase
          .from('customers')
          .update({
            total_purchases: customer.total_purchases + saleData.total,
            last_purchase: new Date().toISOString()
          })
          .eq('id', saleData.customer_id)
          .eq('user_id', user.id)
      }
    }

    // Create financial record
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
    await generateSaleInsight(saleRecord, saleData.items)

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
      if (item.product_id) {
        // Extract main product ID if it's a variation
        const mainProductId = item.product_id.includes('-') ? item.product_id.split('-')[0] : item.product_id;
        const product = products.find(p => p.id === mainProductId);
        
        if (product) {
          // Calculate new stock after sale
          let newStock = product.stock - item.quantity;
          
          // If it's a variation, get the variation's stock instead
          if (item.product_id.includes('-')) {
            const variationId = item.product_id.split('-')[1];
            const variation = productVariations.find(v => v.id === variationId);
            if (variation) {
              newStock = variation.stock - item.quantity;
            }
          }
          
          if (newStock <= product.min_stock) {
            // Check if we already have a low stock insight for this product
            const existingInsight = aiInsights.find(insight => 
              insight.category === 'inventory' && 
              insight.data?.product_id === mainProductId &&
              !insight.is_read
            );
            
            // Only create new insight if one doesn't exist
            if (!existingInsight) {
              const lowStockInsight = {
                user_id: user.id,
                type: 'alert' as const,
                title: 'Estoque Baixo Após Venda',
                description: `O produto "${item.product_name}" ficou com estoque baixo após a venda. Considere reabastecer.`,
                priority: 'high' as const,
                category: 'inventory' as const,
                data: { product_id: mainProductId, current_stock: newStock },
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