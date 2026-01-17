-- Add support for multiple images per message

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_urls jsonb;
