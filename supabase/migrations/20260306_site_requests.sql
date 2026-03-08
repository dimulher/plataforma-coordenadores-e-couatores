-- =============================================================
-- SITE REQUESTS — Solicitações de site de divulgação dos coautores
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS site_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coauthor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'PENDENTE'
                 CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
  notes        TEXT,
  website_url  TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coauthor_id)  -- um coautor só pode ter uma solicitação ativa por vez
);

ALTER TABLE site_requests ENABLE ROW LEVEL SECURITY;

-- Coautor vê a própria solicitação
CREATE POLICY "sr_select_own"
  ON site_requests FOR SELECT
  USING (coauthor_id = auth.uid());

-- Coautor cria a própria solicitação
CREATE POLICY "sr_insert_own"
  ON site_requests FOR INSERT
  WITH CHECK (coauthor_id = auth.uid());

-- Coautor pode cancelar a própria solicitação
CREATE POLICY "sr_update_own"
  ON site_requests FOR UPDATE
  USING (coauthor_id = auth.uid())
  WITH CHECK (coauthor_id = auth.uid());

-- Admin e Coordenador veem e gerenciam todas as solicitações
CREATE POLICY "sr_staff"
  ON site_requests FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

-- Trigger updated_at
CREATE TRIGGER trg_site_requests_updated_at
  BEFORE UPDATE ON site_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
