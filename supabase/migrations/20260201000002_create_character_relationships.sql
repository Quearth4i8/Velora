CREATE TABLE IF NOT EXISTS public.character_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  bond_points integer NOT NULL DEFAULT 0,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT character_relationships_bond_points_check CHECK (bond_points >= 0 AND bond_points <= 1000),
  CONSTRAINT character_relationships_user_character_unique UNIQUE (user_id, character_id)
);

ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "character_relationships_isolation_select" ON public.character_relationships;
DROP POLICY IF EXISTS "character_relationships_isolation_insert" ON public.character_relationships;
DROP POLICY IF EXISTS "character_relationships_isolation_update" ON public.character_relationships;
DROP POLICY IF EXISTS "character_relationships_isolation_delete" ON public.character_relationships;

CREATE POLICY "character_relationships_isolation_select" ON public.character_relationships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "character_relationships_isolation_insert" ON public.character_relationships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "character_relationships_isolation_update" ON public.character_relationships
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "character_relationships_isolation_delete" ON public.character_relationships
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS character_relationships_user_id_idx ON public.character_relationships (user_id);
CREATE INDEX IF NOT EXISTS character_relationships_character_id_idx ON public.character_relationships (character_id);
