-- Fix video_likes foreign key to reference profiles instead of auth.users
-- This resolves issues where authenticated users don't have records in auth.users table

-- First, drop the existing foreign key constraint
ALTER TABLE video_likes 
DROP CONSTRAINT IF EXISTS video_likes_user_id_fkey;

-- Add new foreign key constraint referencing profiles
ALTER TABLE video_likes 
ADD CONSTRAINT video_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also fix videos table user_id if it has the same issue
ALTER TABLE videos 
DROP CONSTRAINT IF EXISTS videos_user_id_fkey;

ALTER TABLE videos 
ADD CONSTRAINT videos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
