-- Documentos da conferência + notificações do subscritor (fonte única no Supabase Hetzner)
-- Executar após aamihe-init.sql:
--   docker compose exec -T db psql -U postgres < aamihe-documents-notifications.sql

CREATE TABLE IF NOT EXISTS public.aamihe_documents (
  id text PRIMARY KEY,
  site_slug text NOT NULL DEFAULT 'aamihe',
  title_pt text NOT NULL,
  title_en text,
  title_fr text,
  file_url text NOT NULL,
  language text NOT NULL DEFAULT 'pt',
  category text NOT NULL DEFAULT 'conferencia',
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  author text,
  email text,
  user_id text,
  message text,
  year text,
  file_type text,
  mime_type text,
  source text,
  review_status text,
  review_comment text,
  review_comment_at timestamptz,
  reviewed_at timestamptz,
  resubmitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aamihe_documents_user_id_idx ON public.aamihe_documents (user_id);
CREATE INDEX IF NOT EXISTS aamihe_documents_email_lower_idx ON public.aamihe_documents (LOWER(email));
CREATE INDEX IF NOT EXISTS aamihe_documents_category_idx ON public.aamihe_documents (category);
CREATE INDEX IF NOT EXISTS aamihe_documents_category_published_idx
  ON public.aamihe_documents (category, published);

CREATE TABLE IF NOT EXISTS public.aamihe_subscriber_notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  document_id text REFERENCES public.aamihe_documents (id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aamihe_subscriber_notifications_user_idx
  ON public.aamihe_subscriber_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS aamihe_subscriber_notifications_unread_idx
  ON public.aamihe_subscriber_notifications (user_id, read)
  WHERE read = false;

ALTER TABLE public.aamihe_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aamihe_subscriber_notifications ENABLE ROW LEVEL SECURITY;

-- Leitura pública só de documentos gerais publicados
DROP POLICY IF EXISTS "aamihe_documents_public_read" ON public.aamihe_documents;
CREATE POLICY "aamihe_documents_public_read"
  ON public.aamihe_documents FOR SELECT
  USING (category = 'geral' AND published = true);
