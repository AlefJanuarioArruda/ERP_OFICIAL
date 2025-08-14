/*
  # Product Variations Schema

  1. New Tables
    - `product_variations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (uuid, references products)
      - `variation_name` (text) -- e.g., "Azul - M"
      - `color` (text, optional)
      - `size` (text, optional)
      - `sku` (text, unique per user)
      - `stock` (integer, default 0)
      - `price` (decimal, optional - uses parent product price if null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on product_variations table
    - Add policies for users to only access their own variations
*/

-- Create product_variations table
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variation_name text NOT NULL,
  color text,
  size text,
  sku text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  price decimal(10,2), -- Optional, uses parent product price if null
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sku)
);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variations
CREATE POLICY "Users can view their own product variations"
  ON product_variations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own product variations"
  ON product_variations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own product variations"
  ON product_variations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own product variations"
  ON product_variations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_product_variations_updated_at
  BEFORE UPDATE ON product_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_variations_user_id ON product_variations(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);