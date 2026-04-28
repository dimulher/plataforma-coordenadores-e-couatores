-- =============================================================
-- RLS FIX — Corrige recursão nas policies de profiles e
--           adiciona INSERT para coautor em chapters
-- Execute este SQL no Supabase SQL Editor
-- =============================================================

-- -------------------------------------------------------
-- 1. Função get_my_role() — SECURITY DEFINER evita recursão
--    Lê o role do usuário sem acionar RLS de profiles
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- -------------------------------------------------------
-- 2. PROFILES — recriar policies sem recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_admin_coord" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"       ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"       ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON profiles;

CREATE POLICY "profiles_select_admin_coord" ON profiles FOR SELECT
  USING (get_my_role() IN ('ADMIN','COORDENADOR','LIDER','GESTOR','CS','VENDEDOR'));

CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'ADMIN');

-- Coautor/coordenador pode atualizar o próprio perfil
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- -------------------------------------------------------
-- 3. CHAPTERS — adiciona INSERT para coautor + corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "chapters_insert_own"         ON chapters;
DROP POLICY IF EXISTS "chapters_select_admin_coord" ON chapters;
DROP POLICY IF EXISTS "chapters_all_admin"          ON chapters;
DROP POLICY IF EXISTS "chapters_update_coord"       ON chapters;

-- Coautor pode inserir seu próprio capítulo
CREATE POLICY "chapters_insert_own" ON chapters FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "chapters_select_admin_coord" ON chapters FOR SELECT
  USING (get_my_role() IN ('ADMIN','COORDENADOR','LIDER','CS'));

CREATE POLICY "chapters_all_admin" ON chapters FOR ALL
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "chapters_update_coord" ON chapters FOR UPDATE
  USING (get_my_role() IN ('COORDENADOR','ADMIN'));

-- -------------------------------------------------------
-- 4. PROJECT_PARTICIPANTS — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "pp_select_admin_coord" ON project_participants;
DROP POLICY IF EXISTS "pp_all_admin"          ON project_participants;

CREATE POLICY "pp_select_admin_coord" ON project_participants FOR SELECT
  USING (get_my_role() IN ('ADMIN','COORDENADOR','LIDER','GESTOR','CS'));

CREATE POLICY "pp_all_admin" ON project_participants FOR ALL
  USING (get_my_role() = 'ADMIN');

-- -------------------------------------------------------
-- 5. PROJECTS — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "projects_select_admin_coord" ON projects;
DROP POLICY IF EXISTS "projects_all_admin"          ON projects;

CREATE POLICY "projects_select_admin_coord" ON projects FOR SELECT
  USING (get_my_role() IN ('ADMIN','COORDENADOR','LIDER','GESTOR','CS'));

CREATE POLICY "projects_all_admin" ON projects FOR ALL
  USING (get_my_role() = 'ADMIN');

-- -------------------------------------------------------
-- 6. CHAPTER_VERSIONS — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "cv_all_admin" ON chapter_versions;

CREATE POLICY "cv_all_admin" ON chapter_versions FOR ALL
  USING (get_my_role() IN ('ADMIN','COORDENADOR'));

-- -------------------------------------------------------
-- 7. REVIEWER_NOTES — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "rn_all_admin_coord" ON reviewer_notes;

CREATE POLICY "rn_all_admin_coord" ON reviewer_notes FOR ALL
  USING (get_my_role() IN ('ADMIN','COORDENADOR'));

-- -------------------------------------------------------
-- 8. MENTORSHIPS — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "mentorships_all_admin" ON mentorships;

CREATE POLICY "mentorships_all_admin" ON mentorships FOR ALL
  USING (get_my_role() IN ('ADMIN','COORDENADOR'));

-- -------------------------------------------------------
-- 9. ANNOUNCEMENTS — corrige recursão
-- -------------------------------------------------------
DROP POLICY IF EXISTS "announcements_all_admin" ON announcements;

CREATE POLICY "announcements_all_admin" ON announcements FOR ALL
  USING (get_my_role() IN ('ADMIN','COORDENADOR'));
