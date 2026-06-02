# Brevo — envio de email (Vercel → Gmail)

Enquanto a Hetzner bloqueia a **porta 25**, o site (admin, notificações) envia via **Brevo SMTP** (porta 587).

## 1. Conta Brevo

1. [https://www.brevo.com](https://www.brevo.com) → criar conta (plano free).
2. **Transactional** → **SMTP & API** → separador **SMTP**.
3. **Generate SMTP key** — copiar a **chave SMTP** (não é a password da conta nem API key v3).
4. Anotar o **SMTP login** (email que o Brevo mostra como utilizador).

## 2. Remetente e domínio

1. **Senders & IP** → **Domains** → adicionar **aamihe.com**.
2. Copiar os registos **DNS** (SPF, DKIM) para o DirectAdmin → **DNS Management** de `aamihe.com`.
3. **Senders** → adicionar e confirmar **geral@aamihe.com** (ou o endereço que quiser no From).

Só envia se o **From** estiver verificado no Brevo.

## 3. Variáveis na Vercel (Production)

| Variável | Valor |
|----------|--------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | login SMTP do painel Brevo |
| `SMTP_PASS` | chave SMTP gerada |
| `SITE_EMAIL_FROM` | `AAMIHE <geral@aamihe.com>` (igual ao remetente verificado) |
| `SITE_NOTIFY_EMAIL` | `geral@aamihe.com` |

Opcional — **repor senha** também pelo Brevo (em vez do Exim no VPS):

| Variável | Valor |
|----------|--------|
| `PASSWORD_RESET_USE_SITE_SMTP` | `true` |

CLI (substitua `CHAVE_SMTP` e `LOGIN_SMTP`):

```bash
cd ~/Desktop/APP/gestao/aamihe.com
npx vercel env update SMTP_HOST production --value "smtp-relay.brevo.com" -y
npx vercel env update SMTP_PORT production --value "587" -y
npx vercel env update SMTP_SECURE production --value "false" -y
npx vercel env update SMTP_USER production --value "LOGIN_SMTP" -y
npx vercel env update SMTP_PASS production --value "CHAVE_SMTP" -y --sensitive
npx vercel env update SITE_EMAIL_FROM production --value "AAMIHE <geral@aamihe.com>" -y
npx vercel env update PASSWORD_RESET_USE_SITE_SMTP production --value "true" -y
```

**Redeploy** em Production após alterar variáveis.

## 4. Testar

- Admin → **Enviar email** — aviso de SMTP desligado deve desaparecer.
- Login → **Repor senha** (se `PASSWORD_RESET_USE_SITE_SMTP=true`).
- Destino de teste: Gmail.

## 5. O que o Brevo **não** resolve sozinho

| Canal | Situação |
|-------|----------|
| Site / API na **Vercel** | OK com Brevo |
| **Roundcube** no VPS | Ainda precisa da porta 25 ou smarthost no Exim |
| Pedir desbloqueio 25 na Hetzner | Continua útil para mail no próprio servidor |

## Links

- [SMTP Brevo (PT)](https://help.brevo.com/hc/pt/articles/7924908994450)
- [Portas 587 / 2525 / 465](https://help.brevo.com/hc/en-us/articles/10905415650322)
