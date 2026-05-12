-- Execute este SQL no Supabase > SQL Editor

CREATE TABLE public.inscricoes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text        NOT NULL,
  sexo             text        NOT NULL,
  contacto         text        NOT NULL,
  whatsapp         text        NOT NULL,
  distrito         text        NOT NULL,
  localizacao      text        NOT NULL,
  idade            text        NOT NULL,
  departamento     text,
  batizado_agua    boolean     NOT NULL DEFAULT false,
  batizado_espirito boolean    NOT NULL DEFAULT false,
  funcao           text        NOT NULL,
  hospedagem       text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Activar Row Level Security
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode inserir (formulário público)
CREATE POLICY "insert_public" ON public.inscricoes
  FOR INSERT TO anon WITH CHECK (true);

-- Apenas utilizadores autenticados (admin) podem ler
CREATE POLICY "select_authenticated" ON public.inscricoes
  FOR SELECT TO authenticated USING (true);
