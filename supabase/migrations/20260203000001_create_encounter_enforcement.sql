CREATE TABLE IF NOT EXISTS public.encounter_enforcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  scenario_id text,
  strike_count integer NOT NULL DEFAULT 0,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT encounter_enforcement_strike_count_check CHECK (strike_count >= 0 AND strike_count <= 3),
  CONSTRAINT encounter_enforcement_user_conversation_unique UNIQUE (user_id, conversation_id)
);

ALTER TABLE public.encounter_enforcement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "encounter_enforcement_isolation_select" ON public.encounter_enforcement;
DROP POLICY IF EXISTS "encounter_enforcement_isolation_insert" ON public.encounter_enforcement;
DROP POLICY IF EXISTS "encounter_enforcement_isolation_update" ON public.encounter_enforcement;
DROP POLICY IF EXISTS "encounter_enforcement_isolation_delete" ON public.encounter_enforcement;

CREATE POLICY "encounter_enforcement_isolation_select" ON public.encounter_enforcement
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "encounter_enforcement_isolation_insert" ON public.encounter_enforcement
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "encounter_enforcement_isolation_update" ON public.encounter_enforcement
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "encounter_enforcement_isolation_delete" ON public.encounter_enforcement
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS encounter_enforcement_user_id_idx ON public.encounter_enforcement (user_id);
CREATE INDEX IF NOT EXISTS encounter_enforcement_conversation_id_idx ON public.encounter_enforcement (conversation_id);
