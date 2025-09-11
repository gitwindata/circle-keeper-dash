-- Migration: Add cabang column to hairstylists table
-- Run this in Supabase SQL Editor if you haven't added the cabang column yet

-- Add cabang column to hairstylists table
ALTER TABLE hairstylists ADD COLUMN IF NOT EXISTS cabang TEXT;

-- Add comment for documentation
COMMENT ON COLUMN hairstylists.cabang IS 'Branch/location where the hairstylist works';

-- Optional: Create index for faster filtering by branch
CREATE INDEX IF NOT EXISTS idx_hairstylists_cabang ON hairstylists(cabang);

-- Verify the column was added (optional check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'hairstylists' 
-- ORDER BY ordinal_position;