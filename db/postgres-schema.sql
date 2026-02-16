-- PostgreSQL Schema for Velora
-- Run this in pgAdmin 4 Query Tool

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE character_images 
        SET is_primary = FALSE 
        WHERE character_id = NEW.character_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTH SCHEMA (Supabase-compatible)
-- ============================================

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name, points_balance, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'full_name')::TEXT, split_part(NEW.email, '@', 1)),
        100,
        FALSE
    )
    ON CONFLICT (username) DO UPDATE SET
        id = EXCLUDED.id,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid null,
  id uuid not null DEFAULT uuid_generate_v4(),
  aud character varying(255) null,
  role character varying(255) null DEFAULT 'authenticated',
  email character varying(255) null,
  encrypted_password character varying(255) null,
  email_confirmed_at timestamp with time zone null,
  invited_at timestamp with time zone null,
  confirmation_token character varying(255) null,
  confirmation_sent_at timestamp with time zone null,
  recovery_token character varying(255) null,
  recovery_sent_at timestamp with time zone null,
  email_change_token_new character varying(255) null,
  email_change character varying(255) null,
  email_change_sent_at timestamp with time zone null,
  last_sign_in_at timestamp with time zone null,
  raw_app_meta_data jsonb null DEFAULT '{}',
  raw_user_meta_data jsonb null DEFAULT '{}',
  is_super_admin boolean null DEFAULT FALSE,
  created_at timestamp with time zone null DEFAULT NOW(),
  updated_at timestamp with time zone null DEFAULT NOW(),
  phone text null,
  phone_confirmed_at timestamp with time zone null,
  phone_change text null DEFAULT '',
  phone_change_token character varying(255) null DEFAULT '',
  phone_change_sent_at timestamp with time zone null,
  confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED null,
  email_change_token_current character varying(255) null DEFAULT '',
  email_change_confirm_status smallint null DEFAULT 0,
  banned_until timestamp with time zone null,
  reauthentication_token character varying(255) null DEFAULT '',
  reauthentication_sent_at timestamp with time zone null,
  is_sso_user boolean not null DEFAULT FALSE,
  deleted_at timestamp with time zone null,
  is_anonymous boolean not null DEFAULT FALSE,
  constraint users_pkey primary key (id),
  constraint users_phone_key unique (phone),
  constraint users_email_change_confirm_status_check check (
    email_change_confirm_status >= 0 AND email_change_confirm_status <= 2
  )
);

CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users USING btree (instance_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS confirmation_token_idx ON auth.users USING btree (confirmation_token) 
  WHERE confirmation_token !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS recovery_token_idx ON auth.users USING btree (recovery_token) 
  WHERE recovery_token !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_current_idx ON auth.users USING btree (email_change_token_current) 
  WHERE email_change_token_current !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS email_change_token_new_idx ON auth.users USING btree (email_change_token_new) 
  WHERE email_change_token_new !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS reauthentication_token_idx ON auth.users USING btree (reauthentication_token) 
  WHERE reauthentication_token !~ '^[0-9 ]*$';
CREATE UNIQUE INDEX IF NOT EXISTS users_email_partial_key ON auth.users USING btree (email) 
  WHERE is_sso_user = FALSE;
CREATE INDEX IF NOT EXISTS users_is_anonymous_idx ON auth.users USING btree (is_anonymous);

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users 
FOR EACH ROW
EXECUTE FUNCTION auth.handle_new_user();

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  spin_pity_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- ============================================
-- CHARACTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  age INTEGER,
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
  style VARCHAR(50),
  model VARCHAR(100),
  generated_image TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  name VARCHAR(100),
  eye_type VARCHAR(20) DEFAULT 'normal',
  clothing VARCHAR(20) DEFAULT 'casual',
  environment TEXT,
  skin_tone TEXT,
  is_gallery_only BOOLEAN DEFAULT FALSE,
  character_type TEXT NOT NULL DEFAULT 'custom' CHECK (character_type IN ('custom', 'special')),
  main_tag TEXT,
  lora_name TEXT,
  lora_weight NUMERIC,
  special_prompt TEXT,
  special_negative_prompt TEXT,
  style_preset TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  custom_clothing TEXT,
  futanari BOOLEAN DEFAULT FALSE,
  heat INTEGER DEFAULT 25 CHECK (heat IS NULL OR (heat >= 0 AND heat <= 100)),
  clothing_color TEXT
);

CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_futanari ON characters(futanari);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_character_type ON characters(character_type);
CREATE INDEX IF NOT EXISTS idx_characters_style_preset ON characters(style_preset);

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CHARACTER IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS character_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  is_primary BOOLEAN DEFAULT FALSE,
  generation_prompt TEXT,
  generation_model TEXT,
  generation_style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  generation_seed BIGINT
);

CREATE INDEX IF NOT EXISTS idx_character_images_character_id ON character_images(character_id);
CREATE INDEX IF NOT EXISTS idx_character_images_is_primary ON character_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_character_images_created_at ON character_images(created_at);

DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON character_images;
CREATE TRIGGER ensure_single_primary_image_trigger BEFORE INSERT OR UPDATE ON character_images
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();

DROP TRIGGER IF EXISTS update_character_images_updated_at ON character_images;
CREATE TRIGGER update_character_images_updated_at BEFORE UPDATE ON character_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_character_id ON conversations(character_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'character', 'system')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  image_urls JSONB
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;

-- ============================================
-- CHARACTER RELATIONSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS character_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  bond_points INTEGER NOT NULL DEFAULT 0 CHECK (bond_points >= 0 AND bond_points <= 1000),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_character_relationships_user_id ON character_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_character_relationships_character_id ON character_relationships(character_id);

-- ============================================
-- VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  character_image_id UUID REFERENCES character_images(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  mime_type TEXT,
  source_type TEXT CHECK (source_type IN ('video_request', 'direct_import', 'generated')),
  source_id UUID,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_character_id ON videos(character_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Add other tables as needed (conversation_context, encounter_enforcement, etc.)
