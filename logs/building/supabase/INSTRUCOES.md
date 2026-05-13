# Supabase — Instruções para Logs Automáticos

## ⚠️ Atenção: dois tipos de token

| Token | Onde fica | Para quê |
|-------|-----------|----------|
| `anon key` | `.env` (VITE_SUPABASE_ANON_KEY) | Acesso ao banco pelo app |
| `Access Token` | Conta Supabase | Management API — para logs |

O script de logs precisa do **Access Token**, não da anon key.

---

## 1. Obter o Access Token

1. Acede a **https://supabase.com/dashboard/account/tokens**
2. Clica em **Generate new token**
3. Nome sugerido: `logs-script`
4. Copia o token gerado

## 2. Adicionar ao `.env`

```env
SUPABASE_ACCESS_TOKEN=<token_gerado_acima>
```

> **Nunca comites o `.env`** — já está no `.gitignore`.

## 3. Testar com curl

```bash
# Verificar que o token funciona:
curl https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
# Resposta esperada: lista de projectos JSON

# Testar logs do PostgreSQL (API calls ao banco):
curl -X POST \
  "https://api.supabase.com/v1/projects/wyynplryfcbosnoqtydh/analytics/endpoints/logs.all" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "select timestamp, event_message from postgres_logs order by timestamp desc limit 10"}'

# Logs de autenticação:
curl -X POST \
  "https://api.supabase.com/v1/projects/wyynplryfcbosnoqtydh/analytics/endpoints/logs.all" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "select timestamp, event_message from auth_logs order by timestamp desc limit 10"}'

# Logs do PostgREST (inserções e leituras via app):
curl -X POST \
  "https://api.supabase.com/v1/projects/wyynplryfcbosnoqtydh/analytics/endpoints/logs.all" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "select timestamp, event_message from postgrest_logs order by timestamp desc limit 10"}'
```

## Tabelas disponíveis no Log Explorer

| Tabela | O que mostra |
|--------|-------------|
| `postgres_logs` | Queries e erros do banco |
| `postgrest_logs` | Chamadas à API REST (inscrições, leituras) |
| `auth_logs` | Tentativas de autenticação |
| `edge_logs` | Edge Functions (se usares) |
| `realtime_logs` | Subscriptions em tempo real |

> Para o formulário de inscrições, `postgrest_logs` é o mais relevante.

## 4. Correr os logs

```bash
npm run logs
```

## Cascading

```
today/  →  week/  →  month/  →  year/  →  ever/
```
