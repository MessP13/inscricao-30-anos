-- Correr no Supabase SQL Editor
-- https://supabase.com/dashboard/project/wyynplryfcbosnoqtydh/sql/new

CREATE TABLE IF NOT EXISTS ievc_historico (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ      DEFAULT NOW(),
  nome               TEXT NOT NULL,
  sexo               TEXT,
  provincia          TEXT,
  distrito           TEXT,
  igreja             TEXT,
  localidade         TEXT,
  funcao             TEXT,
  quando_ingressou   TEXT,
  whatsapp           TEXT,
  telefone           TEXT,
  email              TEXT,
  missionarios       JSONB DEFAULT '[]',
  obreiros_nacionais JSONB DEFAULT '[]',
  onde_comecou             TEXT,
  onde_comecou_outro       TEXT,
  igrejas_distrito                INT,
  templos_concluidos_distrito     INT,
  templos_construcao_distrito     INT,
  templos_material_distrito       INT,
  primeira_congregacao TEXT,
  congregacoes         JSONB DEFAULT '[]',
  data_inauguracao     JSONB,
  desafios        TEXT[],
  desafios_outros TEXT,
  momentos_marcantes TEXT,
  experiencia_marcante TEXT,
  impacto_comunidade   TEXT,
  possui_documentos  BOOLEAN,
  referencias        JSONB DEFAULT '[]',
  observacoes_finais TEXT,
  declaracao_verdadeira BOOLEAN DEFAULT FALSE,
  anexos           JSONB DEFAULT '[]',
  notas_adicionais JSONB DEFAULT '[]'
);

ALTER TABLE ievc_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_insert" ON ievc_historico FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "historico_select" ON ievc_historico FOR SELECT USING (true);
CREATE POLICY "historico_update" ON ievc_historico FOR UPDATE USING (true);
