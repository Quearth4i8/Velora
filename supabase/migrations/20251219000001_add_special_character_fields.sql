alter table public.characters
  add column if not exists character_type text not null default 'custom',
  add column if not exists main_tag text,
  add column if not exists lora_name text,
  add column if not exists lora_weight numeric,
  add column if not exists special_prompt text,
  add column if not exists special_negative_prompt text;

do $$ begin
  alter table public.characters
    add constraint characters_character_type_check
    check (character_type in ('custom', 'special'));
exception
  when duplicate_object then null;
end $$;

create index if not exists characters_character_type_idx
  on public.characters (character_type);

alter table public.characters enable row level security;
alter table public.character_images enable row level security;

do $$ begin
  create policy "characters_public_select" on public.characters
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "characters_public_insert" on public.characters
    for insert
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "characters_public_update" on public.characters
    for update
    using (true)
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "characters_public_delete" on public.characters
    for delete
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "character_images_public_select" on public.character_images
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "character_images_public_insert" on public.character_images
    for insert
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "character_images_public_update" on public.character_images
    for update
    using (true)
    with check (true);
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "character_images_public_delete" on public.character_images
    for delete
    using (true);
exception
  when duplicate_object then null;
end $$;
