/*
  # Add Cost Price to Product Variations

  1. Schema Changes
    - Add `cost_price` column to `product_variations` table
    - Set default value to allow existing variations to work
    - Add check constraint to ensure cost_price is not negative

  2. Changes
    - `cost_price` (decimal, optional - uses parent product cost_price if null)
    - Maintains backward compatibility with existing variations
*/

-- Add cost_price column to product_variations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variations' AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE product_variations ADD COLUMN cost_price decimal(10,2);
  END IF;
END $$;

-- Add check constraint to ensure cost_price is not negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'product_variations_cost_price_check'
  ) THEN
    ALTER TABLE product_variations ADD CONSTRAINT product_variations_cost_price_check CHECK (cost_price IS NULL OR cost_price >= 0);
  END IF;
END $$;