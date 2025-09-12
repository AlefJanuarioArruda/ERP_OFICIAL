@@ .. @@
 DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
 CREATE POLICY "Authenticated users can upload product images"
 ON storage.objects FOR INSERT
 TO authenticated
-WITH CHECK (bucket_id = 'product-images' AND auth.uid() = owner);
+WITH CHECK (bucket_id = 'product-images');
 
 CREATE POLICY "Users can update their own product images"
 ON storage.objects FOR UPDATE
 TO authenticated
 USING (bucket_id = 'product-images');
 
 CREATE POLICY "Users can delete their own product images"
 ON storage.objects FOR DELETE
 TO authenticated
 USING (bucket_id = 'product-images');
 
 -- Create RLS policies for the avatars bucket
 CREATE POLICY "Anyone can view avatars"
 ON storage.objects FOR SELECT
 USING (bucket_id = 'avatars');
 
 DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
 CREATE POLICY "Authenticated users can upload avatars"
 ON storage.objects FOR INSERT
 TO authenticated
-WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
+WITH CHECK (bucket_id = 'avatars');
 
 CREATE POLICY "Users can update their own avatars"
 ON storage.objects FOR UPDATE