# Email AAMIHE — DirectAdmin / Exim

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                                │
│  • Admin → Enviar email / newsletters                            │
│  • Notificações (conferência, etc.)                              │
│  → SMTP autenticado: mail.aamihe.com:587 (conta DirectAdmin)    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Hetzner — Exim (DirectAdmin)                                    │
│  Mesmo servidor que PHP mail() e webmail                         │
└────────────────────────────▲────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│  Docker — Supabase Auth (GoTrue)                                 │
│  • Repor senha no login                                            │
│  → SMTP local: 172.17.0.1:25 (sem auth, gateway Docker → Exim)   │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Vercel (obrigatório para envio pelo site)

No [painel Vercel](https://vercel.com) → projeto **aamihe.com** → Settings → Environment Variables → **Production**:

| Variável | Valor |
|----------|--------|
| `SMTP_HOST` | `mail.aamihe.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `noreply@aamihe.com` |
| `SMTP_PASS` | palavra-passe da conta no **DirectAdmin → E-mail Accounts** |
| `SITE_EMAIL_FROM` | `AAMIHE <noreply@aamihe.com>` |
| `SITE_NOTIFY_EMAIL` | `geral@aamihe.com` |

CLI (substitua `SUA_SENHA`):

```bash
npx vercel env update SMTP_PASS production --value 'SUA_SENHA' -y --sensitive
```

Depois: **redeploy** (novo deployment) para as funções carregarem as variáveis.

Validar: `/admin/enviar-email` — se SMTP estiver OK, o aviso de «não configurado» desaparece.

## 2. VPS — Auth / repor senha

No servidor (SSH porta **2234**):

```bash
cd /root
# Copiar do Mac (na pasta do projecto):
# scp -P 2234 scripts/supabase-hetzner/fix-auth-recovery-email.sh root@37.27.17.25:/root/
bash fix-auth-recovery-email.sh
```

Isto executa `configure-smtp-env.sh` (modo local `172.17.0.1:25`) e `configure-auth-env.sh`.

Revisão no servidor:

```bash
bash review-email-config.sh --server
```

(copiar `scripts/email/review-email-config.sh` para `/root/`)

## 3. O que não misturar

| Erro comum | Correcto |
|------------|----------|
| `SMTP_HOST=127.0.0.1` na Vercel | Só no VPS se o Node correr lá |
| `PASSWORD_RESET_USE_SITE_SMTP=true` na Vercel | Deixar por defeito: repor senha via GoTrue + Exim local |
| SMTP `mail.aamihe.com:587` dentro do Docker Auth | Usar `172.17.0.1:25` (porta 587 costuma dar timeout) |

## Revisão rápida

```bash
bash scripts/email/review-email-config.sh
```

## Porta 25 de saída bloqueada (Hetzner)

Se o log mostra `Connection timed out` para `gmail-smtp-in.l.google.com` **em IPv4** e `nc -4 ... 25` falha, mas `google.com:443` funciona:

- Exim e DKIM podem estar OK; o bloqueio é **rede (Hetzner)** na porta 25 de saída.
- Pedir desbloqueio: [Hetzner Robot](https://robot.hetzner.com) → servidor → **Unblock SMTP port 25** (ou ticket ao suporte).
- Até lá, emails externos (Gmail, etc.) não saem; Roundcube local pode aceitar mas ficam na fila.
