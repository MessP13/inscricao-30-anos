-- Execute este SQL no Supabase > SQL Editor

DO $$
BEGIN
  IF to_regclass('public.inscricoes_30_anos') IS NULL
     AND to_regclass('public.inscricoes') IS NOT NULL THEN
    ALTER TABLE public.inscricoes RENAME TO inscricoes_30_anos;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.inscricoes_30_anos (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  text        NOT NULL,
  sexo                  text        NOT NULL,
  contacto              text        NOT NULL DEFAULT '',
  whatsapp              text        NOT NULL DEFAULT '',
  distrito              text        NOT NULL,
  localizacao           text        NOT NULL,
  idade                 text        NOT NULL,
  departamento          text        NOT NULL DEFAULT '',
  batizado_agua         boolean     NOT NULL DEFAULT false,
  data_batizado_agua    text,
  batizado_espirito     boolean     NOT NULL DEFAULT false,
  data_batizado_espirito text,
  funcao                text        NOT NULL,
  outra_funcao          text        NOT NULL DEFAULT '',
  hospedagem            text        NOT NULL,
  contribuicao          text        NOT NULL DEFAULT '',
  valor_contribuicao    text        NOT NULL DEFAULT '',
  inscrito_por          text        NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inscricoes_30_anos
  ADD COLUMN IF NOT EXISTS data_batizado_agua text,
  ADD COLUMN IF NOT EXISTS data_batizado_espirito text,
  ADD COLUMN IF NOT EXISTS outra_funcao text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contribuicao text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS valor_contribuicao text NOT NULL DEFAULT '';

ALTER TABLE public.inscricoes_30_anos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_public" ON public.inscricoes_30_anos;
CREATE POLICY "insert_public" ON public.inscricoes_30_anos
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "select_public_for_duplicate_check" ON public.inscricoes_30_anos;
CREATE POLICY "select_public_for_duplicate_check" ON public.inscricoes_30_anos
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "select_authenticated" ON public.inscricoes_30_anos;
CREATE POLICY "select_authenticated" ON public.inscricoes_30_anos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "update_public_for_duplicate_resolution" ON public.inscricoes_30_anos;
CREATE POLICY "update_public_for_duplicate_resolution" ON public.inscricoes_30_anos
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_authenticated" ON public.inscricoes_30_anos;
CREATE POLICY "delete_authenticated" ON public.inscricoes_30_anos
  FOR DELETE TO authenticated USING (true);
