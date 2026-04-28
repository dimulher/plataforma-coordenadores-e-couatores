-- ============================================================
-- RPCs de Relatórios de Performance (Admin)
-- Filtro opcional por período (p_start / p_end)
-- ============================================================

-- 1. Performance por Coordenador
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
  ORDER BY COUNT(l.id) DESC;
$$;

-- 2. Performance por Líder
DROP FUNCTION IF EXISTS get_report_lider_performance(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION get_report_lider_performance(
  p_start TIMESTAMPTZ DEFAULT NULL,
  p_end   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  lider_id            UUID,
  lider_name          TEXT,
  total_coordenadores BIGINT,
  total_leads         BIGINT,
  em_atendimento      BIGINT,
  aprovados           BIGINT,
  coautores_ativos    BIGINT,
  nao_aprovados       BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    pl.id                       AS lider_id,
    pl.name                     AS lider_name,
    COUNT(DISTINCT pc.id)       AS total_coordenadores,
    COUNT(l.id)                 AS total_leads,
    COUNT(l.id) FILTER (WHERE l.status IN ('EM_ATENDIMENTO','EM_AVALIACAO','APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                                AS em_atendimento,
    COUNT(l.id) FILTER (WHERE l.status IN ('APROVADO','CONTRATO_ONBOARDING','COAUTOR_ATIVO'))
                                AS aprovados,
    COUNT(l.id) FILTER (WHERE l.status = 'COAUTOR_ATIVO')
                                AS coautores_ativos,
    COUNT(l.id) FILTER (WHERE l.status = 'NAO_APROVADO')
                                AS nao_aprovados
  FROM profiles pl
  LEFT JOIN profiles pc ON pc.manager_id = pl.id AND pc.role = 'COORDENADOR'
  LEFT JOIN leads l
    ON  l.coordinator_id = pc.id
    AND (p_start IS NULL OR l.created_at >= p_start)
    AND (p_end   IS NULL OR l.created_at <= p_end)
  WHERE pl.role = 'LIDER'
  GROUP BY pl.id, pl.name
  ORDER BY COUNT(l.id) DESC;
$$;

-- 3. Performance por Vendedor
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
  ORDER BY COUNT(l.id) DESC;
$$;
