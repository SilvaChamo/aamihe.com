# Supabase AAMIHE — Hetzner (só AAMIHE)

Instância **isolada** no Hetzner — única fonte de dados do AAMIHE (`supabase.visualdesignmoz.com`).

## Fase 1 — VPS (Hetzner Cloud)

1. [console.hetzner.cloud](https://console.hetzner.cloud) → **Add Server**
2. **CPX31** (4 vCPU, 8 GB RAM), Ubuntu 24.04, localização Falkenstein ou Helsinki
3. Chave SSH (a mesma que usa no servidor)
4. Anote o **IP público** (ex.: `95.x.x.x`)

DNS **Cloudflare**: registo **A** `supabase` → IP do VPS (`supabase.visualdesignmoz.com`)

## Fase 2 — Instalar Supabase no VPS

No Mac, a partir da raiz do projecto:

```bash
scp scripts/supabase-hetzner/install.sh scripts/supabase-hetzner/aamihe-init.sql root@IP_DO_VPS:/root/
ssh root@IP_DO_VPS 'bash /root/install.sh supabase.visualdesignmoz.com'
```

No fim, o script imprime **ANON_KEY**, **SERVICE_ROLE_KEY** e **POSTGRES_PASSWORD**. Guarde em local seguro.

### HTTPS (Caddy, no VPS)

```bash
apt install -y caddy
cat > /etc/caddy/Caddyfile <<'EOF'
api.aamihe.com {
  reverse_proxy localhost:8000
}
EOF
systemctl reload caddy
```

## Fase 3 — Schema AAMIHE

```bash
ssh root@IP_DO_VPS
cd /opt/supabase-aamihe/docker
docker compose exec -T db psql -U postgres < /root/aamihe-init.sql
```

## Fase 4 — SMTP (Auth emails)

Abra `https://supabase.visualdesignmoz.com` (Studio) → **Authentication → Emails → SMTP**:

| Campo | Valor |
|-------|--------|
| Host | `mail.aamihe.com` |
| Port | `587` ou `465` |
| User | `noreply@aamihe.com` |
| Sender | `AAMIHE <noreply@aamihe.com>` |

Redirect URLs:

```
https://aamihe.com/auth/confirm
https://aamihe.com/auth/callback
https://aamihe.vercel.app/auth/confirm
https://aamihe.vercel.app/auth/callback
http://localhost:3004/auth/confirm
http://localhost:3004/auth/callback
```

## Fase 5 — Google OAuth (login «Entrar com Google»)

No servidor Hetzner, com as credenciais do Google Cloud Console:

```bash
scp -P 2234 scripts/supabase-hetzner/configure-google-oauth.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 \
  'GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... bash /root/configure-google-oauth.sh'
```

Isto define `SITE_URL=https://aamihe.com`, `API_EXTERNAL_URL=https://supabase.visualdesignmoz.com` e activa GoTrue Google (para `signInWithIdToken`).

URIs de redireccionamento no **Google Cloud Console**:

- `https://aamihe.com/api/auth/google/callback`
- `https://app.aamihe.com/api/auth/google/callback`
- `http://localhost:3004/api/auth/google/callback`

## Fase 6 — App AAMIHE (única fonte Supabase)

Em `.env.local` e **Vercel** (Production) — só Hetzner, sem cloud:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.visualdesignmoz.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon do Hetzner
SUPABASE_SERVICE_ROLE_KEY=...       # service_role do Hetzner
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_SITE_URL=https://aamihe.com
```

```bash
npm run build
npx vercel deploy --prod --yes
```

Testar: login email/senha, Google, repor senha, notícias, media.

## Backup semanal (cron)

DNS do domínio: **Cloudflare** (NS `*.cloudflare.com`), não Mozserver.

No servidor:

```bash
scp -P 2234 scripts/supabase-hetzner/backup-weekly.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "chmod +x /root/backup-weekly.sh && /root/backup-weekly.sh"
```

Agendar (domingo 03:00):

```bash
crontab -e
# adicionar:
0 3 * * 0 /root/backup-weekly.sh >> /var/log/supabase-aamihe-backup.log 2>&1
```

Backups em `/root/backups/supabase-aamihe/` (últimas 8 semanas). Complementa o snapshot Hetzner do VPS; não substitui.

HTTPS + proxy Apache (DirectAdmin não aplica `.cust` — usar ficheiro extra):

No **Mac** (pasta do projecto):

```bash
cd /Users/macbook/Desktop/APP/gestao/aamihe.com
scp -P 2234 scripts/supabase-hetzner/apache-api-aamihe.conf scripts/supabase-hetzner/install-apache-proxy.sh scripts/supabase-hetzner/patch-da-httpd-api-proxy.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "bash /root/install-apache-proxy.sh"
curl -I https://api.aamihe.com
```

Se ainda mostrar `Server: Apache` e HTML, só o patch DirectAdmin:

```bash
ssh root@37.27.17.25 -p 2234 "bash /root/patch-da-httpd-api-proxy.sh"
```

Esperado: `Server: kong` e `401`. Caddy desactivado se porta 443 ocupada.

## Mudar de `api.aamihe.com` para `supabase.visualdesignmoz.com`

1. Cloudflare: **A** `supabase` → `37.27.17.25` (DNS only)
2. DirectAdmin: subdomínio **supabase** + Let's Encrypt (incluir `supabase.visualdesignmoz.com`)
3. No Mac:

```bash
cd /Users/macbook/Desktop/APP/gestao/aamihe.com
scp -P 2234 scripts/supabase-hetzner/switch-to-supabase-subdomain.sh \
  scripts/supabase-hetzner/patch-da-httpd-supabase-proxy.sh \
  scripts/supabase-hetzner/update-docker-public-url.sh \
  root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "bash /root/switch-to-supabase-subdomain.sh"
curl -I https://supabase.visualdesignmoz.com
```

**Depois de `rewrite_confs`:** o DirectAdmin pode voltar a servir HTML no subdomínio. Corra de novo `bash /root/patch-da-httpd-supabase-proxy.sh` ou instale o proxy persistente:

```bash
scp -P 2234 scripts/supabase-hetzner/apache-supabase-aamihe.conf \
  scripts/supabase-hetzner/install-apache-supabase-proxy.sh \
  scripts/supabase-hetzner/patch-da-httpd-supabase-proxy.sh \
  root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "bash /root/install-apache-supabase-proxy.sh"
```

4. `.env.local` + Vercel: `NEXT_PUBLIC_SUPABASE_URL=https://supabase.visualdesignmoz.com`
5. Studio → Auth URLs com `supabase.visualdesignmoz.com` (não `api`)

Padrão futuro: `supabase.[dominio-do-site]` (ex. `supabase.entrecampos.pt`).

## Duas contas no Studio (Admin + cliente)

No servidor, após SSL:

```bash
scp -P 2234 scripts/supabase-hetzner/setup-dashboard-users.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 "bash /root/setup-dashboard-users.sh"
```

| Conta | Utilizador | Uso |
|-------|------------|-----|
| Sua | `Admin` | Manutenção |
| Cliente | `Supabase` | Entrega (`CREDENCIAIS-ENTREGA-CLIENTE.md`) |

Passwords por defeito no script (altere no servidor se quiser):

- Admin: `Administrador#01?*`
- Supabase: `=Bdgest.AaSupabase?*`
