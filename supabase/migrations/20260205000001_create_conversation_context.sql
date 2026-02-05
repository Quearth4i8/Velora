CREATE TABLE IF NOT EXISTS public.conversation_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  relation text,
  sex_toys text[] NOT NULL DEFAULT '{}'::text[],
  gifts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_context_user_conversation_unique UNIQUE (user_id, conversation_id)
);

ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_context_isolation_select" ON public.conversation_context;
DROP POLICY IF EXISTS "conversation_context_isolation_insert" ON public.conversation_context;
DROP POLICY IF EXISTS "conversation_context_isolation_update" ON public.conversation_context;
DROP POLICY IF EXISTS "conversation_context_isolation_delete" ON public.conversation_context;

CREATE POLICY "conversation_context_isolation_select" ON public.conversation_context
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "conversation_context_isolation_insert" ON public.conversation_context
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_context_isolation_update" ON public.conversation_context
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversation_context_isolation_delete" ON public.conversation_context
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS conversation_context_user_id_idx ON public.conversation_context (user_id);
CREATE INDEX IF NOT EXISTS conversation_context_conversation_id_idx ON public.conversation_context (conversation_id);
