-- Use this script to attribute all existing data to a specific user
-- This bypasses user trigger conflicts that cause the 27000 error

BEGIN;

-- 1. Disable USER triggers (avoids permission errors on system triggers)
-- Note: This requires the user running the script to be the owner of the table or have sufficient permissions.
ALTER TABLE public.characters DISABLE TRIGGER USER;
ALTER TABLE public.character_images DISABLE TRIGGER USER;

-- 2. Update characters table first (parent table)
UPDATE public.characters 
SET user_id = 'd822ecf9-3c6c-454b-b742-3a345781da6a'
WHERE user_id IS NULL;

-- 3. Update character_images table (child table)
UPDATE public.character_images 
SET user_id = 'd822ecf9-3c6c-454b-b742-3a345781da6a'
WHERE user_id IS NULL;

-- 4. Re-enable USER triggers
ALTER TABLE public.characters ENABLE TRIGGER USER;
ALTER TABLE public.character_images ENABLE TRIGGER USER;

COMMIT;
