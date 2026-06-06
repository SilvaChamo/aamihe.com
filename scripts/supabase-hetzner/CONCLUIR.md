# Concluir migração AAMIHE → Hetzner

## Já feito (automático)

- [x] Migração: `site_content`, `site_media`, 2 utilizadores + perfis
- [x] `.env.local` apontado para `https://supabase.visualdesignmoz.com`
- [x] `npm run build` OK

## No servidor (SSH) — Auth redirects

```bash
scp -P 2234 scripts/supabase-hetzner/configure-auth-env.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "bash /root/configure-auth-env.sh"
```

## Studio → SMTP (manual)

**Authentication → Emails → Enable custom SMTP**

| Campo | Valor |
|-------|--------|
| Host | `mail.aamihe.com` |
| Port | `587` |
| User | `noreply@aamihe.com` |
| Password | *(conta de email)* |
| Sender | `AAMIHE <noreply@aamihe.com>` |

## Vercel (Production)

Actualizar (painel ou CLI):

```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.visualdesignmoz.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon Hetzner>
SUPABASE_SERVICE_ROLE_KEY=<service_role Hetzner>
```

Depois deploy (só com autorização):

```bash
npx vercel deploy --prod --yes
```

## Senhas dos utilizadores do site

Após migração, definir no Studio → **Authentication → Users** → user → **Reset password**  
ou **Repor senha** no login do site.

## Testes

1. https://supabase.visualdesignmoz.com — Studio (Admin / Supabase)
2. https://aamihe.vercel.app/dashboard/login — login (ou https://aamihe.com)
3. Notícias / media no admin
