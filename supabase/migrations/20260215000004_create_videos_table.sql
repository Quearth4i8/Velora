-- Create videos table for storing imported/generated videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  character_image_id UUID REFERENCES character_images(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Metadata
  duration INTEGER, -- in seconds
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  mime_type TEXT,
  -- Source tracking (from video_requests or direct import)
  source_type TEXT CHECK (source_type IN ('video_request', 'direct_import', 'generated')),
  source_id UUID,
  -- Stats
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  -- Admin notes
  admin_notes TEXT,
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Videos are viewable by everyone"
  ON videos
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Only admins can insert videos"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update videos"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete videos"
  ON videos
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_videos_character_id ON videos(character_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_likes_count ON videos(likes_count DESC);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Video likes table (many-to-many)
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS on video_likes
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own likes"
  ON video_likes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own likes"
  ON video_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON video_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update video likes count
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes count
DROP TRIGGER IF EXISTS video_likes_count_trigger ON video_likes;
CREATE TRIGGER video_likes_count_trigger
  AFTER INSERT OR DELETE ON video_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_video_likes_count();

-- Function to increment video views
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos SET views_count = views_count + 1 WHERE id = video_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO anon, authenticated;
