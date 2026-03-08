-- =============================================================
-- Adiciona suporte a solicitações de site para COORDENADORES
-- Execute no Supabase SQL Editor
-- =============================================================

-- 1. Torna coauthor_id nullable (coordenador não tem coauthor_id)
ALTER TABLE site_requests ALTER COLUMN coauthor_id DROP NOT NULL;

-- 2. Adiciona coluna coordinator_id
ALTER TABLE site_requests
  ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Unique parcial: um coordenador só pode ter uma solicitação
CREATE UNIQUE INDEX IF NOT EXISTS site_requests_coordinator_id_key
  ON site_requests (coordinator_id) WHERE coordinator_id IS NOT NULL;

-- 4. Garante que ao menos um dos dois campos está preenchido
ALTER TABLE site_requests
  ADD CONSTRAINT site_requests_requester_check
  CHECK (coauthor_id IS NOT NULL OR coordinator_id IS NOT NULL);

-- 5. Coordenador vê a própria solicitação
CREATE POLICY "sr_select_coordinator"
  ON site_requests FOR SELECT
  USING (coordinator_id = auth.uid());

-- 6. Coordenador cria a própria solicitação
CREATE POLICY "sr_insert_coordinator"
  ON site_requests FOR INSERT
  WITH CHECK (coordinator_id = auth.uid());

-- 7. Coordenador atualiza/cancela a própria solicitação
CREATE POLICY "sr_update_coordinator"
  ON site_requests FOR UPDATE
  USING (coordinator_id = auth.uid())
  WITH CHECK (coordinator_id = auth.uid());
