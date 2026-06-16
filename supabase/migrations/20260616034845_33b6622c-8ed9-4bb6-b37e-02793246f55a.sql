CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');