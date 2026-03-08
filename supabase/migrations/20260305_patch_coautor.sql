-- =============================================================
-- PATCH COAUTOR — Ajustes nas tabelas existentes + Storage
-- Execute este SQL no Supabase SQL Editor
-- =============================================================

-- -------------------------
-- 1. PROFILES — colunas extras (caso não aplicadas)
-- -------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url     TEXT,
  ADD COLUMN IF NOT EXISTS phone          TEXT,
  ADD COLUMN IF NOT EXISTS cep            TEXT,
  ADD COLUMN IF NOT EXISTS address        TEXT,
  ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- -------------------------
-- 2. PROJECT_PARTICIPANTS — adiciona PK e timestamp
-- -------------------------
-- Só executa se a coluna id não existir
-- Adiciona coluna id apenas se não existir (sem tentar criar PK duplicada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_participants' AND column_name = 'id'
  ) THEN
    ALTER TABLE project_participants
      ADD COLUMN id UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

ALTER TABLE project_participants
  ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'COAUTOR',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Garante UNIQUE em (project_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_participants_project_id_user_id_key'
  ) THEN
    ALTER TABLE project_participants
      ADD CONSTRAINT project_participants_project_id_user_id_key UNIQUE (project_id, user_id);
  END IF;
END $$;

-- -------------------------
-- 3. REVIEWER_NOTES — normaliza colunas
-- -------------------------
-- Adiciona coluna 'author' como alias de author_name (se não existir)
ALTER TABLE reviewer_notes
  ADD COLUMN IF NOT EXISTS author     TEXT GENERATED ALWAYS AS (author_name) STORED;

-- Ou, alternativamente: apenas adiciona a coluna author_name se não existir
-- (o código já foi atualizado para usar author_name OR author)

ALTER TABLE reviewer_notes
  ADD COLUMN IF NOT EXISTS date       TIMESTAMPTZ GENERATED ALWAYS AS (created_at) STORED;

ALTER TABLE reviewer_notes
  ADD COLUMN IF NOT EXISTS tag        TEXT DEFAULT 'Ajuste',
  ADD COLUMN IF NOT EXISTS status     TEXT GENERATED ALWAYS AS (
    CASE WHEN resolved THEN 'Resolvida' ELSE 'Aberta' END
  ) STORED;

-- -------------------------
-- 4. CHAPTERS — colunas que podem estar faltando
-- -------------------------
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'Contrato',
  ADD COLUMN IF NOT EXISTS submitted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at   TIMESTAMPTZ;

-- -------------------------
-- 5. STORAGE — Bucket "profiles" para avatares
-- -------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- Storage policies
DROP POLICY IF EXISTS "profiles_storage_select_public" ON storage.objects;
CREATE POLICY "profiles_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles_storage_insert_own" ON storage.objects;
CREATE POLICY "profiles_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.uid() IS NOT NULL
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  );

DROP POLICY IF EXISTS "profiles_storage_update_own" ON storage.objects;
CREATE POLICY "profiles_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles'
    AND auth.uid() IS NOT NULL
    AND name LIKE 'avatars/' || auth.uid()::text || '%'
  );

-- -------------------------
-- 6. RLS POLICIES principais (idempotentes)
-- -------------------------
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own"         ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin_coord" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"       ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"       ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_select_admin_coord"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- PROJECT_PARTICIPANTS
DROP POLICY IF EXISTS "pp_select_own"         ON project_participants;
DROP POLICY IF EXISTS "pp_select_admin_coord" ON project_participants;
DROP POLICY IF EXISTS "pp_all_admin"          ON project_participants;

CREATE POLICY "pp_select_own"
  ON project_participants FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pp_select_admin_coord"
  ON project_participants FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

CREATE POLICY "pp_all_admin"
  ON project_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- PROJECTS
DROP POLICY IF EXISTS "projects_select_participant" ON projects;
DROP POLICY IF EXISTS "projects_select_admin_coord" ON projects;
DROP POLICY IF EXISTS "projects_all_admin"          ON projects;

CREATE POLICY "projects_select_participant"
  ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_participants pp WHERE pp.project_id = projects.id AND pp.user_id = auth.uid()));

CREATE POLICY "projects_select_admin_coord"
  ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

CREATE POLICY "projects_all_admin"
  ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

-- CHAPTERS
DROP POLICY IF EXISTS "chapters_select_own"         ON chapters;
DROP POLICY IF EXISTS "chapters_update_own"         ON chapters;
DROP POLICY IF EXISTS "chapters_select_admin_coord" ON chapters;
DROP POLICY IF EXISTS "chapters_all_admin"          ON chapters;
DROP POLICY IF EXISTS "chapters_update_coord"       ON chapters;

CREATE POLICY "chapters_select_own"
  ON chapters FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "chapters_update_own"
  ON chapters FOR UPDATE
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "chapters_select_admin_coord"
  ON chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

CREATE POLICY "chapters_all_admin"
  ON chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'));

CREATE POLICY "chapters_update_coord"
  ON chapters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'COORDENADOR'));

-- CHAPTER_VERSIONS
DROP POLICY IF EXISTS "cv_select_own"   ON chapter_versions;
DROP POLICY IF EXISTS "cv_insert_own"   ON chapter_versions;
DROP POLICY IF EXISTS "cv_delete_own"   ON chapter_versions;
DROP POLICY IF EXISTS "cv_all_admin"    ON chapter_versions;

CREATE POLICY "cv_select_own"
  ON chapter_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid()));

CREATE POLICY "cv_insert_own"
  ON chapter_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid()));

CREATE POLICY "cv_delete_own"
  ON chapter_versions FOR DELETE
  USING (EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid()));

CREATE POLICY "cv_all_admin"
  ON chapter_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

-- REVIEWER_NOTES
DROP POLICY IF EXISTS "rn_select_chapter_author" ON reviewer_notes;
DROP POLICY IF EXISTS "rn_all_admin_coord"        ON reviewer_notes;

CREATE POLICY "rn_select_chapter_author"
  ON reviewer_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM chapters c WHERE c.id = reviewer_notes.chapter_id AND c.author_id = auth.uid()));

CREATE POLICY "rn_all_admin_coord"
  ON reviewer_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

-- MENTORSHIPS
DROP POLICY IF EXISTS "mentorships_select_authenticated" ON mentorships;
DROP POLICY IF EXISTS "mentorships_all_admin"            ON mentorships;

CREATE POLICY "mentorships_select_authenticated"
  ON mentorships FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "mentorships_all_admin"
  ON mentorships FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "announcements_select_authenticated" ON announcements;
DROP POLICY IF EXISTS "announcements_all_admin"            ON announcements;

CREATE POLICY "announcements_select_authenticated"
  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_all_admin"
  ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','COORDENADOR')));

-- -------------------------
-- 7. TRIGGER updated_at
-- -------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_chapters_updated_at ON chapters;
CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
