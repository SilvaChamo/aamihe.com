-- Schema AAMIHE — Supabase self-hosted (Hetzner)
-- Executar: docker compose exec -T db psql -U postgres < aamihe-init.sql

-- Multimédia
CREATE TABLE IF NOT EXISTS public.site_media (
  id text PRIMARY KEY,
  site_slug text NOT NULL DEFAULT 'aamihe',
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL DEFAULT 'Upload',
  mime_type text NOT NULL,
  size bigint,
  source text NOT NULL DEFAULT 'upload',
  source_id text,
  published boolean NOT NULL DEFAULT true,
  catalog_key text NOT NULL,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_media_catalog_key_idx ON public.site_media (catalog_key);
CREATE INDEX IF NOT EXISTS site_media_published_idx ON public.site_media (published);

-- Conteúdo (notícias, categorias, documentos, settings)
CREATE TABLE IF NOT EXISTS public.site_content (
  site_slug text PRIMARY KEY DEFAULT 'aamihe',
  news jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_media_public_read" ON public.site_media;
CREATE POLICY "site_media_public_read"
  ON public.site_media FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read"
  ON public.site_content FOR SELECT
  USING (true);

-- Perfis login AAMIHE
CREATE TABLE IF NOT EXISTS public.aamihe_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  alcunha TEXT NOT NULL DEFAULT '',
  display_name_type TEXT NOT NULL DEFAULT 'full_name',
  role TEXT NOT NULL DEFAULT 'Subscritor',
  bio TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  profissao TEXT NOT NULL DEFAULT '',
  cargo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aamihe_user_profiles_username_idx
  ON public.aamihe_user_profiles (LOWER(username));

CREATE INDEX IF NOT EXISTS aamihe_user_profiles_email_idx
  ON public.aamihe_user_profiles (LOWER(email));

ALTER TABLE public.aamihe_user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aamihe_profiles_select_own" ON public.aamihe_user_profiles;
CREATE POLICY "aamihe_profiles_select_own" ON public.aamihe_user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "aamihe_profiles_update_own" ON public.aamihe_user_profiles;
CREATE POLICY "aamihe_profiles_update_own" ON public.aamihe_user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "aamihe_profiles_insert_own" ON public.aamihe_user_profiles;
CREATE POLICY "aamihe_profiles_insert_own" ON public.aamihe_user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('aamihe-media', 'aamihe-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aamihe-backups', 'aamihe-backups', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
