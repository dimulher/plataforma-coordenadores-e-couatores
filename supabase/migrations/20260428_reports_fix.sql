-- ============================================================
-- CORREÇÃO: RPCs de Relatórios + constraint de status de leads
-- Rodar no Supabase SQL Editor
-- ============================================================

-- 1. Atualiza constraint de status da tabela leads
--    (adiciona os status usados na aplicação)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'NOVO','CONTATO','REUNIAO','CONTRATO','CONVERTIDO','DESISTIU',
  'INDICADO','CADASTRO_COMPLETO','EM_ATENDIMENTO','EM_AVALIACAO',
  'APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO','NAO_APROVADO'
));

-- ============================================================
-- 2. Performance por Coordenador
--    Com HAVING condicional: quando há filtro de data, mostra
--    apenas coordenadores com leads no período.
-- ============================================================
DROP FUNCTION IF EXISTS get_report_coordinator_performance(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION get_report_coordinator_performance(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  coordinator_id   UUID,
  coordinator_name TEXT,
  lider_id         UUID,
  lider_name       TEXT,
  total_leads      BIGINT,
  em_atendimento   BIGINT,
  aprovados        BIGINT,
  coautores_ativos BIGINT,
  nao_aprovados    BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pc.id                      AS coordinator_id,
    pc.name                    AS coordinator_name,
    pl.id                      AS lider_id,
    COALESCE(pl.name, '—')     AS lider_name,
    COUNT(l.id)                AS total_leads,
    COUNT(l.id) FILTER (WHERE l.status IN ('EM_ATENDIMENTO','EM_AVALIACAO','APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                               AS em_atendimento,
    COUNT(l.id) FILTER (WHERE l.status IN ('APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                               AS aprovados,
    COUNT(l.id) FILTER (WHERE l.status = 'COAUTOR_ATIVO')
                               AS coautores_ativos,
    COUNT(l.id) FILTER (WHERE l.status = 'NAO_APROVADO')
                               AS nao_aprovados
  FROM profiles pc
  LEFT JOIN profiles pl ON pl.id = pc.manager_id
  LEFT JOIN leads l
    ON  l.coordinator_id = pc.id
    AND (p_start IS NULL OR l.created_at >= p_start)
    AND (p_end   IS NULL OR l.created_at <= p_end)
  WHERE pc.role = 'COORDENADOR'
  GROUP BY pc.id, pc.name, pl.id, pl.name
  HAVING (p_start IS NULL AND p_end IS NULL) OR COUNT(l.id) > 0
  ORDER BY COUNT(l.id) DESC;
$$;

-- ============================================================
-- 3. Performance por Vendedor (mesma lógica de HAVING)
-- ============================================================
DROP FUNCTION IF EXISTS get_report_vendedor_performance(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION get_report_vendedor_performance(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  vendedor_id      UUID,
  vendedor_name    TEXT,
  leads_atribuidos BIGINT,
  em_atendimento   BIGINT,
  aprovados        BIGINT,
  coautores_ativos BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pv.id   AS vendedor_id,
    pv.name AS vendedor_name,
    COUNT(l.id)                AS leads_atribuidos,
    COUNT(l.id) FILTER (WHERE l.status IN ('EM_ATENDIMENTO','EM_AVALIACAO','APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                               AS em_atendimento,
    COUNT(l.id) FILTER (WHERE l.status IN ('APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                               AS aprovados,
    COUNT(l.id) FILTER (WHERE l.status = 'COAUTOR_ATIVO')
                               AS coautores_ativos
  FROM profiles pv
  LEFT JOIN leads l
    ON  l.vendedor_id = pv.id
    AND (p_start IS NULL OR l.created_at >= p_start)
    AND (p_end   IS NULL OR l.created_at <= p_end)
  WHERE pv.role = 'VENDEDOR'
  GROUP BY pv.id, pv.name
  HAVING (p_start IS NULL AND p_end IS NULL) OR COUNT(l.id) > 0
  ORDER BY COUNT(l.id) DESC;
$$;

-- ============================================================
-- 4. Drill-down: coordenadores atendidos por um vendedor
-- ============================================================
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

-- ============================================================
-- 5. Drill-down: leads de um vendedor em um coordenador
-- ============================================================
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

DO $$ BEGIN
  RAISE NOTICE '✓ Constraint de leads.status atualizada';
  RAISE NOTICE '✓ get_report_coordinator_performance criada com filtro de período';
  RAISE NOTICE '✓ get_report_vendedor_performance criada com filtro de período';
  RAISE NOTICE '✓ get_vendedor_coordinator_report criada';
  RAISE NOTICE '✓ get_vendedor_coordinator_leads criada';
END $$;
