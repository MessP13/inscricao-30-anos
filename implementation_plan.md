# Architecture & Implementation Plan: Sistema de Inscrições (30 Anos Visão Cristã)

## ✅ IMPLEMENTADO

### Infraestrutura
- Supabase vinculado (`Historico_IEVC`). Tabela `inscricoes_30_anos` criada.
- Site online em `inscricao-30-anos.vercel.app` (auto-deploy via GitHub).

### Formulário (Fase 3.5 — concluída)
- Campos obrigatórios: Nome, Sexo, Idade, Distrito, Localização, Função, Hospedagem, Contribuição.
- Funções: removidos "Grupo de Louvor" e "Maestro".
- Botões: "Limpar Formulário" (reset + scroll topo) e "Guardar Inscrição".
- Logística: Hospedagem (Sim/Não) + Contribuição (Sim/Não) com campo de valor condicional.

### Painel Admin (Fase 4 — concluída)
- Acesso via botão oculto no footer (`·`), sem destaque visual.
- Login por senha (`VITE_ADMIN_PASSWORD`, default `admin123`).
- Tabela completa ordenada por nome, com todas as colunas.
- Exportação CSV com data no nome do ficheiro.

---

## 🗄️ SCHEMA SUPABASE — SQL a executar

```sql
-- Novas colunas (SQL Editor do Supabase)
ALTER TABLE inscricoes_30_anos
  ADD COLUMN IF NOT EXISTS contribuicao       text,
  ADD COLUMN IF NOT EXISTS valor_contribuicao text;

-- Índice para futura detecção de duplicados
CREATE INDEX IF NOT EXISTS idx_dedup
  ON inscricoes_30_anos (nome, contacto, idade, distrito, localizacao);
```

**Ordem lógica das colunas (export/comparação):**
`id · created_at · nome · sexo · idade · distrito · localizacao · funcao · departamento · contacto · whatsapp · batizado_agua · batizado_espirito · hospedagem · contribuicao · valor_contribuicao`

---

## 🔜 PENDENTE

### Majors (aguardam decisão)
1. **Funções multi-select** — string separada por vírgula (sem mudança no schema) ou array `text[]`?
2. **Contactos dinâmicos** — concatenar no campo existente ou novas colunas?

### Futuro
- **Flag de duplicados** — ao submeter, verificar se já existe registo com mesmo nome + contacto + idade + distrito + localização e alertar.
- **Variável de ambiente no Vercel** — definir `VITE_ADMIN_PASSWORD` em Settings → Environment Variables.
