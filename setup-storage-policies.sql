-- Setup Storage Bucket Policies for Images
-- Run this in Supabase SQL Editor

-- 1. Make images bucket public (if not already)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'images';

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 4. Policy: Allow public read access to all images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'images');

-- 5. Policy: Allow hairstylists to update/delete their own uploaded files
CREATE POLICY "Allow hairstylists to manage their uploads" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Alternative simpler policy for development: Allow all authenticated users full access
-- Uncomment below if you want less restrictive access during development
-- DROP POLICY IF EXISTS "Allow hairstylists to manage their uploads" ON storage.objects;
-- CREATE POLICY "Dev: Allow all authenticated users full access to images" ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'images')
-- WITH CHECK (bucket_id = 'images');

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
