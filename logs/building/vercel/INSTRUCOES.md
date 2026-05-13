# Vercel — Instruções para Logs Automáticos

## 1. Obter o Token

1. Acede a **https://vercel.com/account/tokens**
2. Clica em **Create Token**
3. Nome: inscricao-30-anos
4. Scope: Mess-P-roductions
5. Copia o token gerado

## 2. Adicionar ao `.env`

```env
VERCEL_TOKEN=<token_gerado_acima>
VERCEL_PROJECT_ID=inscricao-30-anos
```

> **Nunca comites o `.env`** — já está no `.gitignore`.

## 3. Testar com curl (antes de correr o script)

```bash
# Verificar que o token funciona:
curl https://api.vercel.com/v2/user \
  -H "Authorization: Bearer SEU_TOKEN"
# Resposta esperada: {"user": {"name": "...", "email": "..."}}

# Listar os teus projectos:
curl "https://api.vercel.com/v9/projects?limit=5" \
  -H "Authorization: Bearer SEU_TOKEN"

# Listar últimos 5 deploys do projecto:
curl "https://api.vercel.com/v6/deployments?projectId=inscricao-30-anos&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN"
# Resposta: {"deployments": [...]}  → campo "state": "READY" ou "ERROR"

# Ver logs de um deploy específico (usa o uid da lista acima):
curl "https://api.vercel.com/v3/deployments/UID_DO_DEPLOY/events" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 4. Correr os logs

```bash
npm run logs
```

O ficheiro `logs/building/vercel/today/YYYY-MM-DD.md` será preenchido automaticamente.

## Cascading

```
today/  →  week/  →  month/  →  year/  →  ever/
```

Os logs de ontem passam para `week/` quando o script corre no dia seguinte.
