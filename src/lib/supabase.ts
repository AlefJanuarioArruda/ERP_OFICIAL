import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage
  }
})

// Database types
export interface Product {
  id: string
  user_id: string
  name: string
  description: string
  price: number
  cost_price: number
  stock: number
  min_stock: number
  category: string
  sku: string
  supplier: string
  image_url: string | null
  created_at: string
  updated_at: string
}
export interface Customer {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  document: string
  address_street: string
  address_city: string
  address_state: string
  address_zip_code: string
  total_purchases: number
  last_purchase: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  user_id: string
  customer_id: string | null
  customer_name: string
  total: number
  subtotal: number
  discount: number
  tax: number
  status: 'pending' | 'completed' | 'cancelled'
  payment_method: 'pix' | 'boleto' | 'card' | 'cash'
  payment_status: 'pending' | 'paid' | 'overdue'
  invoice_number: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  user_id: string
  sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface FinancialRecord {
  id: string
  user_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  status: 'pending' | 'paid' | 'overdue'
  due_date: string
  paid_date: string | null
  customer_id: string | null
  sale_id: string | null
  created_at: string
  updated_at: string
}

export interface AIInsight {
  id: string
  user_id: string
  type: 'prediction' | 'recommendation' | 'alert' | 'summary'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: 'sales' | 'inventory' | 'finance' | 'general'
  data: any
  is_read: boolean
  created_at: string
}

export interface ProductVariation {
  id: string
  user_id: string
  product_id: string
  variation_name: string
  color: string | null
  size: string | null
  sku: string
  stock: number
  price: number | null
  cost_price: number | null
  image_url: string | null
  created_at: string
  updated_at: string
}
