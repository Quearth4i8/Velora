-- VELORA CHARACTER CREATOR - CLEAN SUPABASE SETUP
-- This script handles existing tables and policies gracefully

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group VARCHAR(50),
  custom_age INTEGER,
  ethnicity VARCHAR(50),
  height VARCHAR(50),
  physique VARCHAR(50),
  chest_size VARCHAR(50),
  butt_size VARCHAR(50),
  hair_style VARCHAR(50),
  hair_color VARCHAR(50),
  eye_color VARCHAR(50),
  personality_archetype VARCHAR(100),
  personality_traits JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON characters;
DROP POLICY IF EXISTS "Enable insert for all users" ON characters;
DROP POLICY IF EXISTS "Enable update for all users" ON characters;
DROP POLICY IF EXISTS "Enable delete for all users" ON characters;

-- Create fresh policies
CREATE POLICY "Enable read access for all users" ON characters
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON characters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON characters
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON characters
  FOR DELETE USING (true);

-- Drop existing trigger/function if they exist
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create fresh trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create fresh trigger
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Setup complete! Table "characters" is ready.' AS status;
