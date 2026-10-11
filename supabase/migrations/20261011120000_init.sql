-- Rivendo: schema iniziale.
-- Ogni utente vede e modifica solo le proprie righe (Row Level Security).

create table public.items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.items enable row level security;

create policy "items: lettura propria" on public.items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "items: inserimento proprio" on public.items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "items: modifica propria" on public.items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "items: eliminazione propria" on public.items
  for delete to authenticated using ((select auth.uid()) = user_id);

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "settings: lettura propria" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings: inserimento proprio" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings: modifica propria" on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Foto: bucket privato, ogni utente scrive solo nella cartella col proprio id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "foto: lettura propria" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "foto: caricamento proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "foto: modifica propria" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "foto: eliminazione propria" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
