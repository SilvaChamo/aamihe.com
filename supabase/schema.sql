-- AAMIHE: executar no SQL Editor do Supabase

-- Multimédia (biblioteca + galeria)
create table if not exists public.site_media (
  id text primary key,
  site_slug text not null default 'aamihe',
  title text not null,
  url text not null,
  category text not null,
  subcategory text not null default 'Upload',
  mime_type text not null,
  size bigint,
  source text not null default 'upload',
  source_id text,
  published boolean not null default true,
  catalog_key text not null,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_media_catalog_key_idx on public.site_media (catalog_key);
create index if not exists site_media_published_idx on public.site_media (published);

-- Conteúdo do site (notícias, categorias, documentos)
create table if not exists public.site_content (
  site_slug text primary key default 'aamihe',
  news jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Bucket de ficheiros (criar também em Storage → New bucket)
-- Nome: aamihe-media | Public: sim
insert into storage.buckets (id, name, public)
values ('aamihe-media', 'aamihe-media', true)
on conflict (id) do nothing;

-- Políticas básicas (ajuste conforme auth do projeto)
alter table public.site_media enable row level security;
alter table public.site_content enable row level security;

create policy "site_media_public_read"
  on public.site_media for select
  using (published = true);

create policy "site_content_public_read"
  on public.site_content for select
  using (true);
