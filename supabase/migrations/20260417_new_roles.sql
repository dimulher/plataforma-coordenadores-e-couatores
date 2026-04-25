-- ============================================================
-- Migration: Novos Roles — LIDER, CS, VENDEDOR
-- 2026-04-17
-- ============================================================

-- ============================================================
-- 0. Atualizar CHECK CONSTRAINT para aceitar novos roles
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'GESTOR', 'LIDER', 'CS', 'VENDEDOR', 'COORDENADOR', 'COAUTOR'));

-- ============================================================
-- 1. Renomear GESTOR → LIDER nos profiles
-- ============================================================
UPDATE profiles SET role = 'LIDER' WHERE role = 'GESTOR';

-- Atualizar JWT metadata para usuários existentes
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"LIDER"}'::jsonb
WHERE raw_user_meta_data->>'role' = 'GESTOR';

-- ============================================================
-- 2. Criar tabela vendedor_assignments
--    Relaciona VENDEDOR com os coordenadores cujos leads ele gerencia
-- ============================================================
CREATE TABLE IF NOT EXISTS vendedor_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coordinator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendedor_id, coordinator_id)
);

-- ============================================================
-- 3. RLS — vendedor_assignments
-- ============================================================
ALTER TABLE vendedor_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_vendedor_assignments" ON vendedor_assignments
  FOR ALL TO authenticated
  USING (get_my_role() IN ('ADMIN','LIDER'))
  WITH CHECK (get_my_role() IN ('ADMIN','LIDER'));

CREATE POLICY "vendedor_read_own_assignments" ON vendedor_assignments
  FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid());

-- ============================================================
-- 4. Atualizar RLS existentes para aceitar LIDER no lugar de GESTOR
-- ============================================================

-- Perfis: LIDER vê seus coordenadores
DROP POLICY IF EXISTS "Gestors can view their coordinators profiles" ON profiles;
DROP POLICY IF EXISTS "Lideres can view their coordinators profiles" ON profiles;
CREATE POLICY "Lideres can view their coordinators profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR auth.uid() = id
    OR (get_my_role() = 'LIDER' AND manager_id = auth.uid())
    OR (get_my_role() = 'COORDENADOR' AND coordinator_id = auth.uid())
    OR get_my_role() IN ('CS', 'VENDEDOR')
  );

-- Perfis: LIDER pode atualizar seus coordenadores
DROP POLICY IF EXISTS "Gestors can update their coordinators" ON profiles;
DROP POLICY IF EXISTS "Lideres can update their coordinators" ON profiles;
CREATE POLICY "Lideres can update their coordinators" ON profiles
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR auth.uid() = id
    OR (get_my_role() = 'LIDER' AND manager_id = auth.uid())
  );

-- Leads: LIDER, VENDEDOR podem ver leads atribuídos
DROP POLICY IF EXISTS "Gestors can view team leads" ON leads;
DROP POLICY IF EXISTS "Lideres and vendedores can view assigned leads" ON leads;
CREATE POLICY "Lideres and vendedores can view assigned leads" ON leads
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR coordinator_id = auth.uid()
    OR (get_my_role() = 'LIDER' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    ))
    OR (get_my_role() = 'VENDEDOR' AND coordinator_id IN (
      SELECT coordinator_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
    ))
  );

-- Leads: LIDER, VENDEDOR podem atualizar leads atribuídos
DROP POLICY IF EXISTS "Gestors can update team leads" ON leads;
DROP POLICY IF EXISTS "Lideres and vendedores can update assigned leads" ON leads;
CREATE POLICY "Lideres and vendedores can update assigned leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'ADMIN'
    OR coordinator_id = auth.uid()
    OR (get_my_role() = 'LIDER' AND coordinator_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    ))
    OR (get_my_role() = 'VENDEDOR' AND coordinator_id IN (
      SELECT coordinator_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
    ))
  );

-- Capítulos: CS pode ver todos
DROP POLICY IF EXISTS "CS can view all chapters" ON chapters;
CREATE POLICY "CS can view all chapters" ON chapters
  FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('ADMIN', 'CS')
    OR author_id = auth.uid()
    OR (get_my_role() = 'COORDENADOR' AND author_id IN (
      SELECT id FROM profiles WHERE coordinator_id = auth.uid()
    ))
    OR (get_my_role() = 'LIDER' AND author_id IN (
      SELECT id FROM profiles WHERE coordinator_id IN (
        SELECT id FROM profiles WHERE manager_id = auth.uid()
      )
    ))
  );

-- ============================================================
-- 5. RPC get_my_coordinators — atualizar para LIDER
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_coordinators()
RETURNS SETOF profiles
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM profiles
  WHERE manager_id = auth.uid()
    AND role = 'COORDENADOR';
$$;

-- ============================================================
-- 6. RPC get_my_leads_as_vendedor
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_leads_as_vendedor()
RETURNS SETOF leads
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT l.* FROM leads l
  WHERE l.coordinator_id IN (
    SELECT coordinator_id FROM vendedor_assignments WHERE vendedor_id = auth.uid()
  )
  ORDER BY l.created_at DESC;
$$;

-- ============================================================
-- 7. RPC get_all_coauthors_cs — CS vê todos os coautores
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_coauthors_cs()
RETURNS SETOF profiles
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE role = 'COAUTOR' ORDER BY name;
$$;

-- ============================================================
-- 8. RPC get_all_chapters_cs — CS vê todos os capítulos com nome do autor
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_chapters_cs()
RETURNS TABLE(
  id UUID, title TEXT, status TEXT, word_count INT, word_goal INT,
  deadline TIMESTAMPTZ, updated_at TIMESTAMPTZ, author_id UUID,
  author_name TEXT, current_stage TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT c.id, c.title, c.status, c.word_count, c.word_goal,
         c.deadline, c.updated_at, c.author_id,
         p.name AS author_name, c.current_stage
  FROM chapters c
  JOIN profiles p ON p.id = c.author_id
  ORDER BY c.updated_at DESC;
$$;
