-- ============================================================
-- Migration: Vendedor agora é atribuído a LIDER (não coordenador direto)
-- O GESTOR controla toda a distribuição
-- 2026-04-17
-- ============================================================

-- ============================================================
-- 1. Alterar vendedor_assignments: coordinator_id → lider_id
-- ============================================================
ALTER TABLE vendedor_assignments RENAME COLUMN coordinator_id TO lider_id;

-- Recriar constraint de FK com novo nome
ALTER TABLE vendedor_assignments
  DROP CONSTRAINT IF EXISTS vendedor_assignments_coordinator_id_fkey;

ALTER TABLE vendedor_assignments
  ADD CONSTRAINT vendedor_assignments_lider_id_fkey
  FOREIGN KEY (lider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================
-- 2. RLS: GESTOR (não mais LIDER) gerencia atribuições
-- ============================================================
DROP POLICY IF EXISTS "admin_all_vendedor_assignments"   ON vendedor_assignments;
DROP POLICY IF EXISTS "gestor_admin_all_vendedor_assignments" ON vendedor_assignments;

CREATE POLICY "gestor_admin_all_vendedor_assignments" ON vendedor_assignments
  FOR ALL TO authenticated
  USING  (get_my_role() IN ('ADMIN', 'GESTOR'))
  WITH CHECK (get_my_role() IN ('ADMIN', 'GESTOR'));

DROP POLICY IF EXISTS "vendedor_read_own_assignments" ON vendedor_assignments;
CREATE POLICY "vendedor_read_own_assignments" ON vendedor_assignments
  FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid());

-- ============================================================
-- 3. RPC get_my_leads_as_vendedor — agora via lider_id
--    Retorna leads + nome do coordenador + lider para agrupamento
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_leads_as_vendedor()
RETURNS TABLE(
  id            UUID,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  status        TEXT,
  notes         TEXT,
  coordinator_id UUID,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  coordinator_name TEXT,
  lider_id      UUID,
  lider_name    TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    l.id, l.name, l.email, l.phone, l.status, l.notes,
    l.coordinator_id, l.created_at, l.updated_at,
    pc.name  AS coordinator_name,
    pl.id    AS lider_id,
    pl.name  AS lider_name
  FROM leads l
  JOIN profiles pc ON pc.id = l.coordinator_id
  JOIN profiles pl ON pl.id = pc.manager_id
  WHERE pc.manager_id IN (
    SELECT lider_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
  )
  ORDER BY pl.name, pc.name, l.created_at DESC;
$$;

-- ============================================================
-- 4. RPC get_all_vendedores — GESTOR/ADMIN vê todos os vendedores
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_vendedores()
RETURNS SETOF profiles
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE role = 'VENDEDOR' ORDER BY name;
$$;

-- ============================================================
-- 5. RPC get_my_vendedor_assignments — GESTOR vê atribuições dos seus líderes
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_vendedor_assignments()
RETURNS TABLE(
  assignment_id  UUID,
  vendedor_id    UUID,
  vendedor_name  TEXT,
  vendedor_email TEXT,
  lider_id       UUID,
  lider_name     TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    va.id         AS assignment_id,
    va.vendedor_id,
    pv.name       AS vendedor_name,
    pv.email      AS vendedor_email,
    va.lider_id,
    pl.name       AS lider_name
  FROM vendedor_assignments va
  JOIN profiles pv ON pv.id = va.vendedor_id
  JOIN profiles pl ON pl.id = va.lider_id
  WHERE (
    pl.manager_id = auth.uid()
    OR get_my_role() = 'ADMIN'
  )
  ORDER BY pl.name, pv.name;
$$;

-- ============================================================
-- 6. Atualizar RLS de leads para usar nova lógica de lider_id
-- ============================================================
DROP POLICY IF EXISTS "Lideres and vendedores can view assigned leads" ON leads;
CREATE POLICY "Lideres and vendedores can view assigned leads" ON leads
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR coordinator_id = auth.uid()
    OR (get_my_role() = 'LIDER' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    ))
    OR (get_my_role() = 'GESTOR' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id IN (
        SELECT id FROM profiles WHERE manager_id = auth.uid()
      )
    ))
    OR (get_my_role() = 'VENDEDOR' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id IN (
        SELECT lider_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
      )
    ))
  );

DROP POLICY IF EXISTS "Lideres and vendedores can update assigned leads" ON leads;
CREATE POLICY "Lideres and vendedores can update assigned leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR coordinator_id = auth.uid()
    OR (get_my_role() = 'LIDER' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    ))
    OR (get_my_role() = 'GESTOR' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id IN (
        SELECT id FROM profiles WHERE manager_id = auth.uid()
      )
    ))
    OR (get_my_role() = 'VENDEDOR' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id IN (
        SELECT lider_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
      )
    ))
  );
