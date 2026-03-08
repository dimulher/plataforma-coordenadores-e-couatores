-- =============================================================
-- FIX CRÍTICO: Recursão infinita nas policies de profiles
-- EXECUTE ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- =============================================================

-- -------------------------
-- 1. Remove TODAS as policies de TODAS as tabelas
-- -------------------------
DO $$
DECLARE
  pol  RECORD;
  tbl  TEXT;
  tbls TEXT[] := ARRAY['profiles','projects','project_participants','chapters','chapter_versions','reviewer_notes','mentorships','announcements'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- -------------------------
-- 2. Função helper SECURITY DEFINER (evita recursão)
-- -------------------------
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- -------------------------
-- 3. Habilita RLS em todas as tabelas
-- -------------------------
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- 4. POLICIES — PROFILES (sem recursão)
-- -------------------------
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_staff"
  ON profiles FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (get_my_role() = 'ADMIN');

-- -------------------------
-- 5. POLICIES — PROJECT_PARTICIPANTS
-- -------------------------
CREATE POLICY "pp_select_own"
  ON project_participants FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pp_select_staff"
  ON project_participants FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "pp_insert_admin"
  ON project_participants FOR INSERT
  WITH CHECK (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "pp_delete_admin"
  ON project_participants FOR DELETE
  USING (get_my_role() = 'ADMIN');

-- -------------------------
-- 6. POLICIES — PROJECTS
-- -------------------------
CREATE POLICY "projects_select_participant"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_participants pp
      WHERE pp.project_id = projects.id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "projects_select_staff"
  ON projects FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "projects_insert_admin"
  ON projects FOR INSERT
  WITH CHECK (get_my_role() = 'ADMIN');

CREATE POLICY "projects_update_admin"
  ON projects FOR UPDATE
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "projects_delete_admin"
  ON projects FOR DELETE
  USING (get_my_role() = 'ADMIN');

-- -------------------------
-- 7. POLICIES — CHAPTERS
-- -------------------------
CREATE POLICY "chapters_select_own"
  ON chapters FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "chapters_update_own"
  ON chapters FOR UPDATE
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "chapters_select_staff"
  ON chapters FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "chapters_insert_admin"
  ON chapters FOR INSERT
  WITH CHECK (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "chapters_update_staff"
  ON chapters FOR UPDATE
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

CREATE POLICY "chapters_delete_admin"
  ON chapters FOR DELETE
  USING (get_my_role() = 'ADMIN');

-- -------------------------
-- 8. POLICIES — CHAPTER_VERSIONS
-- -------------------------
CREATE POLICY "cv_select_own"
  ON chapter_versions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid())
  );

CREATE POLICY "cv_insert_own"
  ON chapter_versions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid())
  );

CREATE POLICY "cv_delete_own"
  ON chapter_versions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid())
  );

CREATE POLICY "cv_staff"
  ON chapter_versions FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

-- -------------------------
-- 9. POLICIES — REVIEWER_NOTES
-- -------------------------
CREATE POLICY "rn_select_chapter_author"
  ON reviewer_notes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chapters c WHERE c.id = reviewer_notes.chapter_id AND c.author_id = auth.uid())
  );

CREATE POLICY "rn_staff"
  ON reviewer_notes FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

-- -------------------------
-- 10. POLICIES — MENTORSHIPS
-- -------------------------
CREATE POLICY "mentorships_select_auth"
  ON mentorships FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "mentorships_staff"
  ON mentorships FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

-- -------------------------
-- 11. POLICIES — ANNOUNCEMENTS
-- -------------------------
CREATE POLICY "announcements_select_auth"
  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_staff"
  ON announcements FOR ALL
  USING (get_my_role() IN ('ADMIN', 'COORDENADOR'));

-- -------------------------
-- 12. SEED — Mentoria adicionada
-- -------------------------
INSERT INTO mentorships (title, date, link)
VALUES (
  'Como é ser um Agiota no Brasil',
  now() - interval '1 day',
  'https://www.youtube.com/watch?v=dl_H0mq3YIs'
)
ON CONFLICT DO NOTHING;
