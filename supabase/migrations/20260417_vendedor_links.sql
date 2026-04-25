-- ============================================================
-- Tabela de links pessoais do Vendedor
-- ============================================================

CREATE TABLE IF NOT EXISTS vendedor_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'outro',
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendedor_links ENABLE ROW LEVEL SECURITY;

-- Vendedor gerencia apenas os próprios links
CREATE POLICY "vendedor_own_links" ON vendedor_links
  FOR ALL TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

-- Admin vê tudo
CREATE POLICY "admin_all_vendedor_links" ON vendedor_links
  FOR ALL TO authenticated
  USING (get_my_role() = 'ADMIN')
  WITH CHECK (get_my_role() = 'ADMIN');
