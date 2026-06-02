-- Quota diária de e-mails em massa (substitui emailSendLog no dashboard.json)
CREATE TABLE IF NOT EXISTS public.aamihe_email_daily_log (
  date_key date PRIMARY KEY,
  send_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aamihe_email_daily_log ENABLE ROW LEVEL SECURITY;
