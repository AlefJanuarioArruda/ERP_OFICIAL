export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  category: string;
  sku: string;
  supplier?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  totalPurchases: number;
  lastPurchase?: Date;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'pix' | 'boleto' | 'card' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  invoiceNumber?: string;
  createdAt: Date;
  dueDate?: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  customerId?: string;
  saleId?: string;
  createdAt: Date;
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'summary';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'sales' | 'inventory' | 'finance' | 'general';
  data?: any;
  createdAt: Date;
  isRead: boolean;
}

export interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  profit: {
    current: number;
    previous: number;
    change: number;
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
  };
  sales: {
    current: number;
    previous: number;
    change: number;
  };
}