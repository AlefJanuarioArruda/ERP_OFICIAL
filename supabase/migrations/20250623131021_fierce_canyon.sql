/*
  # ERP System Database Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `price` (decimal)
      - `cost_price` (decimal)
      - `stock` (integer)
      - `min_stock` (integer)
      - `category` (text)
      - `sku` (text)
      - `supplier` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `document` (text)
      - `address_street` (text)
      - `address_city` (text)
      - `address_state` (text)
      - `address_zip_code` (text)
      - `total_purchases` (decimal, default 0)
      - `last_purchase` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sales`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `customer_id` (uuid, references customers)
      - `customer_name` (text)
      - `total` (decimal)
      - `subtotal` (decimal)
      - `discount` (decimal, default 0)
      - `tax` (decimal, default 0)
      - `status` (text, default 'completed')
      - `payment_method` (text)
      - `payment_status` (text, default 'paid')
      - `invoice_number` (text)
      - `due_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sale_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `sale_id` (uuid, references sales)
      - `product_id` (uuid, references products)
      - `product_name` (text)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total` (decimal)
      - `created_at` (timestamp)
    
    - `financial_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) -- 'income' or 'expense'
      - `category` (text)
      - `amount` (decimal)
      - `description` (text)
      - `status` (text, default 'pending')
      - `due_date` (timestamp)
      - `paid_date` (timestamp)
      - `customer_id` (uuid, references customers)
      - `sale_id` (uuid, references sales)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ai_insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) -- 'prediction', 'recommendation', 'alert', 'summary'
      - `title` (text)
      - `description` (text)
      - `priority` (text) -- 'low', 'medium', 'high'
      - `category` (text) -- 'sales', 'inventory', 'finance', 'general'
      - `data` (jsonb)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to only access their own data
    - Ensure user_id is automatically set on insert
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL,
  cost_price decimal(10,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  category text NOT NULL,
  sku text NOT NULL,
  supplier text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sku)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  document text NOT NULL,
  address_street text NOT NULL,
  address_city text NOT NULL,
  address_state text NOT NULL,
  address_zip_code text NOT NULL,
  total_purchases decimal(10,2) DEFAULT 0,
  last_purchase timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  total decimal(10,2) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix', 'boleto', 'card', 'cash')),
  payment_status text DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  invoice_number text,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create financial_records table
CREATE TABLE IF NOT EXISTS financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date timestamptz NOT NULL,
  paid_date timestamptz,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('prediction', 'recommendation', 'alert', 'summary')),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  category text NOT NULL CHECK (category IN ('sales', 'inventory', 'finance', 'general')),
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for customers
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for sales
CREATE POLICY "Users can view their own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sales"
  ON sales FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for sale_items
CREATE POLICY "Users can view their own sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sale items"
  ON sale_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sale items"
  ON sale_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for financial_records
CREATE POLICY "Users can view their own financial records"
  ON financial_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own financial records"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own financial records"
  ON financial_records FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own financial records"
  ON financial_records FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own ai insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own ai insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ai insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ai insights"
  ON ai_insights FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_records_updated_at
  BEFORE UPDATE ON financial_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_user_id ON sale_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_user_id ON financial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);