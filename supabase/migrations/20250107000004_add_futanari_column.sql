-- Add futanari column to characters table
ALTER TABLE public.characters 
ADD COLUMN futanari BOOLEAN NULL DEFAULT false;

-- Add index for futanari column for better query performance
CREATE INDEX IF NOT EXISTS idx_characters_futanari ON public.characters USING btree (futanari) TABLESPACE pg_default;
