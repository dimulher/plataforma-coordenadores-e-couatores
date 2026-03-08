-- =============================================================
-- FIX DEFINITIVO: Recursão, Role GESTOR e Auto-Cadastro
-- EXECUTE ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- =============================================================

-- 1. Remove policies problemáticas para recomeçar limpo
DROP POLICY IF EXISTS "profiles_select_staff" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "pp_select_staff" ON project_participants;
DROP POLICY IF EXISTS "pp_insert_admin" ON project_participants;
DROP POLICY IF EXISTS "projects_select_staff" ON projects;
DROP POLICY IF EXISTS "chapters_select_staff" ON chapters;
DROP POLICY IF EXISTS "chapters_insert_admin" ON chapters;
DROP POLICY IF EXISTS "chapters_update_staff" ON chapters;
DROP POLICY IF EXISTS "cv_staff" ON chapter_versions;
DROP POLICY IF EXISTS "rn_staff" ON reviewer_notes;
DROP POLICY IF EXISTS "mentorships_staff" ON mentorships;
DROP POLICY IF EXISTS "announcements_staff" ON announcements;

-- 2. Atualiza a função get_my_role para ser mais resiliente
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- O uso de SECURITY DEFINER aqui faz com que a query ignore o RLS 
  -- da tabela profiles, quebrando a recursão.
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. Políticas para PROFILES (Vínculo Gestor e Auto-Cadastro)
-- Permite que o usuário insira seu próprio perfil durante o cadastro
CREATE POLICY "profiles_insert_self" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Permite que o usuário atualize seu próprio perfil
CREATE POLICY "profiles_update_self" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Permite que Staff (Admin, Coordenador, Gestor) vejam os perfis
CREATE POLICY "profiles_select_staff_gestor"
  ON profiles FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

-- Permite que Admin e Gestor atualizem perfis (Gestor só deve atualizar coordenadores dele via App, mas aqui liberamos no RLS)
CREATE POLICY "profiles_update_staff"
  ON profiles FOR UPDATE
  USING (get_my_role() IN ('ADMIN', 'GESTOR'));

-- 4. Atualiza permissões de Staff em outras tabelas para incluir GESTOR
CREATE POLICY "pp_select_staff_gestor"
  ON project_participants FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "pp_insert_staff_gestor"
  ON project_participants FOR INSERT
  WITH CHECK (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "projects_select_staff_gestor"
  ON projects FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "chapters_select_staff_gestor"
  ON chapters FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "chapters_insert_staff_gestor"
  ON chapters FOR INSERT
  WITH CHECK (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "chapters_update_staff_gestor"
  ON chapters FOR UPDATE
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "cv_staff_gestor"
  ON chapter_versions FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "rn_staff_gestor"
  ON reviewer_notes FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "mentorships_staff_gestor"
  ON mentorships FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));

CREATE POLICY "announcements_staff_gestor"
  ON announcements FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR', 'GESTOR'));
