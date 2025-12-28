-- Secure character and image data using RLS
-- Each user should only see and manage their own characters and images

-- 1. Restrict characters table
DROP POLICY IF EXISTS "characters_public_select" ON public.characters;
DROP POLICY IF EXISTS "characters_public_insert" ON public.characters;
DROP POLICY IF EXISTS "characters_public_update" ON public.characters;
DROP POLICY IF EXISTS "characters_public_delete" ON public.characters;

-- Users can see their own characters, OR special characters (which are global presets)
CREATE POLICY "characters_isolation_select" ON public.characters
    FOR SELECT
    USING (auth.uid() = user_id OR character_type = 'special');

-- Users can only insert characters for themselves
CREATE POLICY "characters_isolation_insert" ON public.characters
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own characters
CREATE POLICY "characters_isolation_update" ON public.characters
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own characters
CREATE POLICY "characters_isolation_delete" ON public.characters
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Restrict character_images table
DROP POLICY IF EXISTS "character_images_public_select" ON public.character_images;
DROP POLICY IF EXISTS "character_images_public_insert" ON public.character_images;
DROP POLICY IF EXISTS "character_images_public_update" ON public.character_images;
DROP POLICY IF EXISTS "character_images_public_delete" ON public.character_images;

-- Users can only see their own images
CREATE POLICY "character_images_isolation_select" ON public.character_images
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert images for themselves
CREATE POLICY "character_images_isolation_insert" ON public.character_images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own images
CREATE POLICY "character_images_isolation_update" ON public.character_images
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own images
CREATE POLICY "character_images_isolation_delete" ON public.character_images
    FOR DELETE
    USING (auth.uid() = user_id);
