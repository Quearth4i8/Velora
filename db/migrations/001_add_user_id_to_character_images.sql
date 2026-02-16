-- Migration: Add user_id column to character_images table if missing
-- This fixes the "column does not exist" error when querying character_images by user_id

DO $$
BEGIN
    -- Check if user_id column exists in character_images
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'character_images' 
        AND column_name = 'user_id'
    ) THEN
        -- Add the missing column
        ALTER TABLE character_images 
        ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_character_images_user_id ON character_images(user_id);
        
        RAISE NOTICE 'Added user_id column to character_images table';
    ELSE
        RAISE NOTICE 'user_id column already exists in character_images table';
    END IF;
END $$;
