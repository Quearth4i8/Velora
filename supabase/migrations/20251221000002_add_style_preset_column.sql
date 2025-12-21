alter table public.characters
  add column if not exists style_preset text;

create index if not exists characters_style_preset_idx
  on public.characters (style_preset);
