-- Perfis AAMIHE (login Supabase Auth — partilha o mesmo projecto que visualdesign)
-- Executar no SQL Editor do Supabase

-- Isolamento entre sites (mesmo Supabase que visualdesign):
-- AAMIHE: só entra quem tem linha nesta tabela (o código não cria perfil no login Google).
-- VisualDESIGN: no callback/login, recusar se existir linha aqui e o utilizador
--   não tiver perfil na tabela `profiles` desse site (ou se user_metadata.site = 'aamihe').

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
