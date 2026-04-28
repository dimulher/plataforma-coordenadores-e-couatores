-- ============================================================
-- RPCs drill-down: vendedor → coordenadores → leads
-- ============================================================

-- Coordenadores atendidos por um vendedor específico (admin)
DROP FUNCTION IF EXISTS get_vendedor_coordinator_report(UUID);
CREATE OR REPLACE FUNCTION get_vendedor_coordinator_report(p_vendedor_id UUID)
RETURNS TABLE(
  coordinator_id   UUID,
  coordinator_name TEXT,
  lider_name       TEXT,
  leads_total      BIGINT,
  em_atendimento   BIGINT,
  aprovados        BIGINT,
  coautores_ativos BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pc.id                      AS coordinator_id,
    pc.name                    AS coordinator_name,
    COALESCE(pl.name, '—')     AS lider_name,
    COUNT(l.id)                AS leads_total,
    COUNT(l.id) FILTER (WHERE l.status IN ('EM_ATENDIMENTO','EM_AVALIACAO','APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO')) AS em_atendimento,
    COUNT(l.id) FILTER (WHERE l.status IN ('APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))                                 AS aprovados,
    COUNT(l.id) FILTER (WHERE l.status = 'COAUTOR_ATIVO')                                                                    AS coautores_ativos
  FROM leads l
  JOIN profiles pc ON pc.id = l.coordinator_id
  LEFT JOIN profiles pl ON pl.id = pc.manager_id
  WHERE l.vendedor_id = p_vendedor_id
  GROUP BY pc.id, pc.name, pl.name
  ORDER BY COUNT(l.id) DESC;
$$;

-- Leads atribuídos a um vendedor em um coordenador específico (admin)
DROP FUNCTION IF EXISTS get_vendedor_coordinator_leads(UUID, UUID);
CREATE OR REPLACE FUNCTION get_vendedor_coordinator_leads(
  p_vendedor_id    UUID,
  p_coordinator_id UUID
)
RETURNS TABLE(
  lead_id    UUID,
  lead_name  TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  status     TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    l.id, l.name, l.phone, l.email, l.status, l.notes, l.created_at, l.updated_at
  FROM leads l
  WHERE l.vendedor_id    = p_vendedor_id
    AND l.coordinator_id = p_coordinator_id
  ORDER BY l.created_at DESC;
$$;
