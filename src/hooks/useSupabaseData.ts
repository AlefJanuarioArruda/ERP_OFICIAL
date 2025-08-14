import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Product, Customer, Sale, SaleItem, FinancialRecord, AIInsight } from '../lib/supabase'

export const useSupabaseData = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([])
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

      setProducts(productsData || [])
      setCustomers(customersData || [])
      setSales(salesData || [])
      setSaleItems(saleItemsData || [])
      setFinancialRecords(financialData || [])
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
      product_id: item.product_id,
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

    // Update product stock
    for (const item of saleData.items) {
      if (item.product_id) {
        const product = products.find(p => p.id === item.product_id)
        if (product) {
          await updateProduct(item.product_id, {
            stock: product.stock - item.quantity
          })
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
        const product = products.find(p => p.id === item.product_id)
        if (product && (product.stock - item.quantity) <= product.min_stock) {
          const lowStockInsight = {
            user_id: user.id,
            type: 'alert' as const,
            title: 'Estoque Baixo Após Venda',
            description: `O produto "${item.product_name}" ficou com estoque baixo após a venda. Considere reabastecer.`,
            priority: 'high' as const,
            category: 'inventory' as const,
            data: { product_id: item.product_id, current_stock: product.stock - item.quantity },
            is_read: false
          }

          const { data: lowStockData } = await supabase
            .from('ai_insights')
            .insert(lowStockInsight)
            .select()
            .single()

          if (lowStockData) {
            setAiInsights(prev => [lowStockData, ...prev])
          }
        }
      }
    }
  }

  // Calculate dashboard metrics
  const getDashboardMetrics = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalIncome = financialRecords
      .filter(r => r.type === 'income' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)
    const totalExpenses = financialRecords
      .filter(r => r.type === 'expense' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      revenue: {
        current: totalRevenue,
        previous: totalRevenue * 0.85, // Mock previous data
        change: 15.0
      },
      profit: {
        current: totalIncome - totalExpenses,
        previous: (totalIncome - totalExpenses) * 0.75,
        change: 25.0
      },
      expenses: {
        current: totalExpenses,
        previous: totalExpenses * 0.9,
        change: 10.0
      },
      sales: {
        current: sales.length,
        previous: Math.max(1, sales.length - 2),
        change: sales.length > 1 ? ((sales.length - (sales.length - 2)) / (sales.length - 2)) * 100 : 100
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