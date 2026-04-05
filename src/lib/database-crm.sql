-- MORADDA CRM - Schema

-- 1. NOVO ROLE: Gestor
INSERT INTO roles (nome, descricao) VALUES
  ('gestor', 'Gestor com visão completa da operação, relatórios e auditoria')
ON CONFLICT (nome) DO NOTHING;

-- 2. NOVOS STATUS DO IMÓVEL
ALTER TABLE imoveis DROP CONSTRAINT IF EXISTS imoveis_status_check;
ALTER TABLE imoveis ADD CONSTRAINT imoveis_status_check 
  CHECK (status IN ('rascunho','enviado_revisao','em_correcao','aprovado','publicado','pausado','reprovado','vendido','alugado','arquivado','inativo'));
UPDATE imoveis SET status = 'enviado_revisao' WHERE status = 'em_revisao';

-- 3. HISTÓRICO DE REVISÃO DE IMÓVEIS
CREATE TABLE IF NOT EXISTS imoveis_revisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  revisor_id uuid REFERENCES users_profiles(id) ON DELETE SET NULL,
  acao varchar NOT NULL CHECK (acao IN ('enviado','aprovado','devolvido','reprovado','pausado','despausado','corrigido')),
  pendencias text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_imoveis_revisoes_imovel ON imoveis_revisoes(imovel_id);

-- 4. NOVOS STATUS DO LEAD
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('novo','em_triagem','qualificado','em_atendimento','aguardando_retorno','followup_agendado','visita_agendada','proposta_enviada','em_negociacao','convertido','perdido','sem_resposta'));
UPDATE leads SET status = 'novo' WHERE status NOT IN ('novo','em_triagem','qualificado','em_atendimento','aguardando_retorno','followup_agendado','visita_agendada','proposta_enviada','em_negociacao','convertido','perdido','sem_resposta');

-- 5. NOVOS CAMPOS NO LEAD
ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivo_perda varchar;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proxima_acao text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proxima_acao_data timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS primeiro_atendimento_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS convertido_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS perdido_at timestamptz;

-- 6. HISTÓRICO/TIMELINE DO LEAD
CREATE TABLE IF NOT EXISTS leads_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES users_profiles(id) ON DELETE SET NULL,
  usuario_nome varchar,
  tipo varchar NOT NULL CHECK (tipo IN ('status','atendimento','followup','visita','proposta','observacao','encaminhamento','contato','sistema')),
  descricao text NOT NULL,
  status_anterior varchar,
  status_novo varchar,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_historico_lead ON leads_historico(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_historico_created ON leads_historico(created_at);

-- 7. FOLLOW-UPS
CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  corretor_id uuid REFERENCES users_profiles(id) ON DELETE SET NULL,
  tipo varchar NOT NULL CHECK (tipo IN ('whatsapp','ligacao','visita','email')),
  data_agendada timestamptz NOT NULL,
  data_realizada timestamptz,
  resultado text,
  observacoes text,
  status varchar DEFAULT 'pendente' CHECK (status IN ('pendente','realizado','cancelado','vencido')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_corretor ON followups(corretor_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_data ON followups(data_agendada);

-- 8. NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
  titulo varchar NOT NULL,
  mensagem text,
  tipo varchar DEFAULT 'info' CHECK (tipo IN ('info','alerta','urgente','sucesso')),
  link text,
  lida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- 9. CONFIGURAÇÕES DE SLA
CREATE TABLE IF NOT EXISTS sla_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar UNIQUE NOT NULL,
  descricao text,
  tempo_minutos int NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
INSERT INTO sla_config (nome, descricao, tempo_minutos) VALUES
  ('primeiro_atendimento', 'Tempo máximo para primeiro atendimento de lead novo', 60),
  ('sem_atualizacao', 'Tempo máximo sem atualização em lead em atendimento', 1440),
  ('sem_acao', 'Tempo máximo sem nova ação programada', 2880),
  ('escalonamento', 'Tempo para escalonar lead parado ao administrativo', 4320)
ON CONFLICT (nome) DO NOTHING;

-- 10. RLS
ALTER TABLE imoveis_revisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revisoes_select_auth" ON imoveis_revisoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "revisoes_insert_auth" ON imoveis_revisoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "historico_select_auth" ON leads_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "historico_insert_auth" ON leads_historico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "followups_select_auth" ON followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "followups_insert_auth" ON followups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "followups_update_auth" ON followups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notif_select_own" ON notificacoes FOR SELECT TO authenticated USING (usuario_id = (SELECT id FROM users_profiles WHERE user_id = auth.uid()));
CREATE POLICY "notif_insert_auth" ON notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif_update_own" ON notificacoes FOR UPDATE TO authenticated USING (usuario_id = (SELECT id FROM users_profiles WHERE user_id = auth.uid()));
CREATE POLICY "sla_select_auth" ON sla_config FOR SELECT TO authenticated USING (true);
