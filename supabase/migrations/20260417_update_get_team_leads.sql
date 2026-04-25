-- ============================================================
-- Atualiza get_team_leads para incluir vendedor_id, vendedor_name e notes
-- ============================================================

DROP FUNCTION IF EXISTS get_team_leads();

CREATE OR REPLACE FUNCTION get_team_leads()
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
  vendedor_id      UUID,
  vendedor_name    TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    l.id, l.name, l.email, l.phone, l.status, l.notes,
    l.coordinator_id, l.created_at, l.updated_at,
    l.vendedor_id,
    pv.name AS vendedor_name
  FROM leads l
  LEFT JOIN profiles pv ON pv.id = l.vendedor_id
  WHERE l.coordinator_id IN (
    SELECT id FROM profiles WHERE manager_id = auth.uid()
  )
  ORDER BY l.created_at DESC;
$$;
