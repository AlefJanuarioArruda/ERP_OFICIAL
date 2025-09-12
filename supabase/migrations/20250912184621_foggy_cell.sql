```sql
-- Drop the existing policy that is too broad
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;

-- Create a new policy to allow authenticated users to update only their own product images
CREATE POLICY "Users can update their own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() = owner);
```