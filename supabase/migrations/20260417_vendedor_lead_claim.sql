-- ============================================================
-- Vendedor: atribuição de leads + RPC update_lead_status
-- ============================================================

-- ── 1. Coluna vendedor_id em leads ─────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 2. RPC update_lead_status ──────────────────────────────
-- Usada pelo GestorFunnelPage e VendedorLeadsPage
CREATE OR REPLACE FUNCTION update_lead_status(lead_id UUID, new_status TEXT)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE leads
  SET status = new_status, updated_at = NOW()
  WHERE id = lead_id;
$$;

-- ── 3. RPC claim_lead_as_vendedor ──────────────────────────
-- Vendedor atribui o lead a si mesmo
CREATE OR REPLACE FUNCTION claim_lead_as_vendedor(p_lead_id UUID)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE leads
  SET vendedor_id = auth.uid(), updated_at = NOW()
  WHERE id = p_lead_id;
$$;

-- ── 4. Atualizar get_my_leads_as_vendedor com vendedor info ─
DROP FUNCTION IF EXISTS get_my_leads_as_vendedor();
CREATE OR REPLACE FUNCTION get_my_leads_as_vendedor()
RETURNS TABLE(
  id               UUID,
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  status           TEXT,
  notes            TEXT,
  coordinator_id   UUID,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  coordinator_name TEXT,
  lider_id         UUID,
  lider_name       TEXT,
  vendedor_id      UUID,
  vendedor_name    TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    l.id, l.name, l.email, l.phone, l.status, l.notes,
    l.coordinator_id, l.created_at, l.updated_at,
    pc.name  AS coordinator_name,
    pl.id    AS lider_id,
    pl.name  AS lider_name,
    l.vendedor_id,
    pv.name  AS vendedor_name
  FROM leads l
  JOIN profiles pc ON pc.id = l.coordinator_id
  JOIN profiles pl ON pl.id = pc.manager_id
  LEFT JOIN profiles pv ON pv.id = l.vendedor_id
  WHERE pc.manager_id IN (
    SELECT lider_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
  )
  ORDER BY pl.name, pc.name, l.created_at DESC;
$$;
