-- Create video_requests table for user-submitted video generation requests
CREATE TABLE IF NOT EXISTS video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES character_images(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  prompt_idea TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'generating', 'completed', 'rejected')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  thumbnail_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS video_requests_user_id_idx ON video_requests(user_id);
CREATE INDEX IF NOT EXISTS video_requests_status_idx ON video_requests(status);
CREATE INDEX IF NOT EXISTS video_requests_image_id_idx ON video_requests(image_id);
CREATE INDEX IF NOT EXISTS video_requests_character_id_idx ON video_requests(character_id);
CREATE INDEX IF NOT EXISTS video_requests_likes_count_idx ON video_requests(likes_count DESC);

-- Enable RLS
ALTER TABLE video_requests ENABLE ROW LEVEL SECURITY;

-- Policies for video_requests
CREATE POLICY "Users can view all approved/completed video requests"
  ON video_requests
  FOR SELECT
  TO authenticated
  USING (status IN ('approved', 'generating', 'completed') OR user_id = auth.uid());

CREATE POLICY "Users can create their own video requests"
  ON video_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending video requests"
  ON video_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own pending video requests"
  ON video_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Create video_request_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS video_request_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_request_id UUID NOT NULL REFERENCES video_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_request_id, user_id)
);

-- Create index for likes
CREATE INDEX IF NOT EXISTS video_request_likes_video_request_id_idx ON video_request_likes(video_request_id);
CREATE INDEX IF NOT EXISTS video_request_likes_user_id_idx ON video_request_likes(user_id);

-- Enable RLS for likes
ALTER TABLE video_request_likes ENABLE ROW LEVEL SECURITY;

-- Policies for video_request_likes
CREATE POLICY "Users can view all video request likes"
  ON video_request_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON video_request_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
  ON video_request_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_video_request_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE video_requests SET likes_count = likes_count + 1 WHERE id = NEW.video_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE video_requests SET likes_count = likes_count - 1 WHERE id = OLD.video_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes count
DROP TRIGGER IF EXISTS video_request_likes_count_trigger ON video_request_likes;
CREATE TRIGGER video_request_likes_count_trigger
  AFTER INSERT OR DELETE ON video_request_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_video_request_likes_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS video_requests_updated_at_trigger ON video_requests;
CREATE TRIGGER video_requests_updated_at_trigger
  BEFORE UPDATE ON video_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_video_requests_updated_at();
