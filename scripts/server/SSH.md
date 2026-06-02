# Comandos no VPS — sempre com entrada SSH

Servidor: **root@37.27.17.25** · porta **2234** (nunca 22)

## Padrão (copiar e colar)

```bash
ssh root@37.27.17.25 -p 2234
```

Um comando remoto:

```bash
ssh root@37.27.17.25 -p 2234 'COMANDO_AQUI'
```

Enviar script local e executar:

```bash
ssh root@37.27.17.25 -p 2234 'bash -s' < scripts/server/NOME-DO-SCRIPT.sh
```

Copiar ficheiro + executar:

```bash
scp -P 2234 scripts/server/NOME-DO-SCRIPT.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 'bash /root/NOME-DO-SCRIPT.sh'
```

## Com `connection.env` (Mac, pasta `scripts/server`)

```bash
cd scripts/server
./remote.sh                           # sessão interactiva
./remote.sh 'exim -bt test@gmail.com' # um comando
./run-on-server.sh fix-exim-ipv4-outbound.sh
```

## Scripts úteis

| Script | Função |
|--------|--------|
| `fix-exim-ipv4-outbound.sh` | Gmail timeout IPv6 → forçar IPv4 no Exim |
| `../supabase-hetzner/fix-auth-recovery-email.sh` | Auth Supabase → Exim local :25 |
| `../email/review-email-config.sh --server` | Revisão SMTP no VPS |

### Exim / Roundcube (Gmail timeout)

Executar **na pasta do projecto** `aamihe.com` (não dentro de `scripts/server`):

```bash
cd ~/Desktop/APP/gestao/aamihe.com
ssh root@37.27.17.25 -p 2234 'bash -s' < scripts/server/fix-exim-ipv4-outbound.sh
```

Se aparecer `malformed retry` no `exim.conf.custom`:

```bash
ssh root@37.27.17.25 -p 2234 'bash -s' < scripts/server/fix-exim-ipv4-outbound.sh --repair
```

### Supabase Auth (repor senha)

```bash
cd ~/Desktop/APP/gestao/aamihe.com
scp -P 2234 scripts/supabase-hetzner/fix-auth-recovery-email.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 'bash /root/fix-auth-recovery-email.sh'
```

### Revisão email no servidor

```bash
cd ~/Desktop/APP/gestao/aamihe.com
scp -P 2234 scripts/email/review-email-config.sh root@37.27.17.25:/root/
ssh root@37.27.17.25 -p 2234 'bash /root/review-email-config.sh --server'
```
