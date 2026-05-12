# Architecture & Implementation Plan: Sistema de Inscrições (30 Anos Visão Cristã)

Este documento define a arquitetura técnica, o modelo de dados, a integração de serviços e a estratégia de deployment para a aplicação web de inscrições do evento de celebração. Foi redigido para alinhar o desenvolvimento com as melhores práticas de escalabilidade, segurança e manutenibilidade.

## 1. Visão Geral da Arquitetura

O sistema utiliza uma arquitetura **Jamstack** / **Serverless**, minimizando a necessidade de gestão de servidores e garantindo alta disponibilidade:

*   **Frontend:** React (via Vite) para um bundle otimizado. CSS Vanilla com escopo global para estilização "Premium" (Glassmorphism, Dark/Gold theme).
*   **Backend as a Service (BaaS):** Supabase (PostgreSQL) para persistência de dados e autenticação de requisições.
*   **Hospedagem & CI/CD:** Vercel, integrado via GitHub, garantindo Edge Caching e CDN global.

## 2. Modelagem de Dados (Supabase/PostgreSQL)

O banco de dados centralizará as inscrições. A tipagem estrita no banco garante a integridade dos dados para exportação futura (Data Analysis).

### Schema SQL (Tabela `inscricoes_30_anos`)

```sql
-- Criação da Tabela Principal
CREATE TABLE IF NOT EXISTS public.inscricoes_30_anos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    sexo TEXT CHECK (sexo IN ('Masculino', 'Feminino')),
    contacto TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    distrito TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    idade TEXT NOT NULL,
    departamento TEXT,
    batizado_agua BOOLEAN DEFAULT false,
    batizado_espirito BOOLEAN DEFAULT false,
    funcao TEXT NOT NULL,
    outra_funcao TEXT,
    hospedagem TEXT CHECK (hospedagem IN ('Sim', 'Não')) NOT NULL
);

-- Índices para otimização de queries analíticas
CREATE INDEX idx_inscricoes_distrito ON public.inscricoes_30_anos(distrito);
CREATE INDEX idx_inscricoes_idade ON public.inscricoes_30_anos(idade);
CREATE INDEX idx_inscricoes_created_at ON public.inscricoes_30_anos(created_at DESC);
```

## 3. Camada de Segurança (Row Level Security - RLS)

> [!IMPORTANT]
> **RLS é Crítico:** Para evitar ataques onde agentes maliciosos possam ler os dados de outros inscritos via API pública, o acesso de leitura (`SELECT`) deve ser bloqueado para a chave anônima (Anon Key).

```sql
-- Habilitar RLS
ALTER TABLE public.inscricoes_30_anos ENABLE ROW LEVEL SECURITY;

-- Policy 1: Permite INSERÇÃO para qualquer usuário (Público)
CREATE POLICY "Permitir insercoes anonimas" 
ON public.inscricoes_30_anos
FOR INSERT 
WITH CHECK (true);

-- Policy 2: Permite LEITURA apenas para painel admin (Autenticado)
CREATE POLICY "Restringir leitura para admins" 
ON public.inscricoes_30_anos
FOR SELECT 
USING (auth.role() = 'authenticated');
```

## 4. Integração Frontend -> Backend

O frontend se comunicará com o Supabase utilizando a biblioteca `@supabase/supabase-js`.

### Fluxo de Submissão (React)

A lógica de submissão será implementada no `App.jsx` utilizando o cliente Supabase configurado em `src/lib/supabaseClient.js`.

## 5. Deployment Strategy (Vercel)

1.  **Versionamento:** GitHub como repositório principal.
2.  **Deployment:** Vercel conectado via Webhook.
3.  **Variáveis de Ambiente:** Configuração obrigatória de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel do Vercel.

---

Este plano foi criado para ser seguido por qualquer desenvolvedor sênior na liderança do projeto.
