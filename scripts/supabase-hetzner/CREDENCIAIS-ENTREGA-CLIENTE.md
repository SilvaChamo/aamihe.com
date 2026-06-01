# Credenciais AAMIHE — entrega ao cliente

Preencher após instalação. **Não commitar** este ficheiro com passwords reais.

## Painel da base de dados (Supabase Studio)

| Campo | Valor |
|-------|--------|
| URL | https://supabase.aamihe.com |
| Utilizador | Supabase |
| Password | *(password cliente — ver gestor de passwords)* |

## Site AAMIHE (área admin)

| Campo | Valor |
|-------|--------|
| URL | https://aamihe.com |
| Login | *(email do administrador do site)* |
| Password | *(definida no registo / repor senha)* |

## API (só para integração técnica — não partilhar publicamente)

| Variável | Notas |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://supabase.aamihe.com |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor — nunca no browser |

## Conta técnica (VisualDESIGN / manutenção)

Conta **Admin** do Studio: uso interno; não entregar ao cliente.
