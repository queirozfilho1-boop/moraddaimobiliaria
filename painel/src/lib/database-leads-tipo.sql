-- ============================================================
-- LEADS · adicionar tipo de interesse
-- 4 categorias: comprar | vender | alugar_imovel | alugar_meu_imovel
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Coluna tipo (com default 'comprar' para leads existentes)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'comprar';

-- 2. Validação dos valores
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_tipo_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_tipo_check
  CHECK (tipo IN ('comprar','vender','alugar_imovel','alugar_meu_imovel'));

-- 3. Índice para filtro rápido por tipo
CREATE INDEX IF NOT EXISTS idx_leads_tipo ON leads(tipo);

-- 4. Permitir 'manual' como origem (caso ainda não esteja na constraint)
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_origem_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_origem_check
  CHECK (origem IN ('site_contato','imovel','avaliacao','whatsapp','vender','manual'));

-- 5. Backfill: leads vindos da origem 'vender' viram tipo 'vender'
UPDATE leads SET tipo = 'vender' WHERE origem = 'vender' AND tipo = 'comprar';
