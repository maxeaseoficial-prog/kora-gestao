
-- expense-receipts: owner-only SELECT
DROP POLICY IF EXISTS "Public can view expense receipts" ON storage.objects;
CREATE POLICY "Users can view their own expense receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expense-receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- mind-map-images: replace broad public SELECT with owner-scoped
DROP POLICY IF EXISTS "Mind map images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can view their own mind map images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mind-map-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- product-images: replace broad public SELECT with owner-scoped
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can view their own product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- mind-map-images: add UPDATE policy
CREATE POLICY "Users can update their own mind map images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'mind-map-images' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'mind-map-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- reports: add UPDATE policy
CREATE POLICY "Users can update their own reports"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'reports' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'reports' AND (auth.uid())::text = (storage.foldername(name))[1]);
