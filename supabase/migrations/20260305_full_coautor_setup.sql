-- =============================================================
-- FULL COAUTOR SETUP - NAB Platform
-- Tabelas, RLS, Storage para a role COAUTOR funcionar 100%
-- =============================================================

-- -------------------------
-- 1. PROFILES (campos extras)
-- -------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS cep         TEXT,
  ADD COLUMN IF NOT EXISTS address     TEXT,
  ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- -------------------------
-- 2. PROJECTS
-- -------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'Livro',
  status      TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'concluido')),
  start_date  DATE,
  end_date    DATE,
  progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- 3. PROJECT_PARTICIPANTS
-- -------------------------
CREATE TABLE IF NOT EXISTS project_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'COAUTOR',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- -------------------------
-- 4. CHAPTERS
-- -------------------------
CREATE TABLE IF NOT EXISTS chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Capítulo sem título',
  status        TEXT DEFAULT 'RASCUNHO' CHECK (
    status IN ('RASCUNHO','EM_EDICAO','ENVIADO_PARA_REVISAO','EM_REVISAO','AJUSTES_SOLICITADOS','APROVADO','FINALIZADO')
  ),
  content_text  TEXT DEFAULT '',
  word_count    INTEGER DEFAULT 0,
  word_goal     INTEGER DEFAULT 1500,
  deadline      TIMESTAMPTZ,
  current_stage TEXT DEFAULT 'Contrato',
  submitted_at  TIMESTAMPTZ,
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- 5. CHAPTER_VERSIONS
-- -------------------------
CREATE TABLE IF NOT EXISTS chapter_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT DEFAULT 'Auto-save',
  word_count INTEGER DEFAULT 0,
  content    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- 6. REVIEWER_NOTES
-- -------------------------
CREATE TABLE IF NOT EXISTS reviewer_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  author     TEXT NOT NULL DEFAULT 'Revisor',
  text       TEXT NOT NULL,
  date       TIMESTAMPTZ DEFAULT now(),
  resolved   BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- 7. MENTORSHIPS
-- -------------------------
CREATE TABLE IF NOT EXISTS mentorships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL DEFAULT 'Mentoria',
  date        TIMESTAMPTZ NOT NULL,
  link        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- -------------------------
-- 8. ANNOUNCEMENTS
-- -------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- RLS — habilitar em todas as tabelas
-- =============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLICIES — PROFILES
-- =============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin e coordenadores podem ver todos os perfis
DROP POLICY IF EXISTS "profiles_select_admin_coord" ON profiles;
CREATE POLICY "profiles_select_admin_coord"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

-- Admin pode atualizar qualquer perfil
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Admin pode inserir perfis
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- =============================================================
-- POLICIES — PROJECTS
-- =============================================================
-- Coautor vê apenas projetos em que participa
DROP POLICY IF EXISTS "projects_select_participant" ON projects;
CREATE POLICY "projects_select_participant"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_participants pp
      WHERE pp.project_id = projects.id
        AND pp.user_id = auth.uid()
    )
  );

-- Admin/Coordenador veem todos os projetos
DROP POLICY IF EXISTS "projects_select_admin_coord" ON projects;
CREATE POLICY "projects_select_admin_coord"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

DROP POLICY IF EXISTS "projects_all_admin" ON projects;
CREATE POLICY "projects_all_admin"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- =============================================================
-- POLICIES — PROJECT_PARTICIPANTS
-- =============================================================
DROP POLICY IF EXISTS "pp_select_own" ON project_participants;
CREATE POLICY "pp_select_own"
  ON project_participants FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pp_select_admin_coord" ON project_participants;
CREATE POLICY "pp_select_admin_coord"
  ON project_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

DROP POLICY IF EXISTS "pp_all_admin" ON project_participants;
CREATE POLICY "pp_all_admin"
  ON project_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- =============================================================
-- POLICIES — CHAPTERS
-- =============================================================
-- Coautor vê e edita seus próprios capítulos
DROP POLICY IF EXISTS "chapters_select_own" ON chapters;
CREATE POLICY "chapters_select_own"
  ON chapters FOR SELECT
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "chapters_update_own" ON chapters;
CREATE POLICY "chapters_update_own"
  ON chapters FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Admin e Coordenador veem e gerenciam todos os capítulos
DROP POLICY IF EXISTS "chapters_select_admin_coord" ON chapters;
CREATE POLICY "chapters_select_admin_coord"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

DROP POLICY IF EXISTS "chapters_all_admin" ON chapters;
CREATE POLICY "chapters_all_admin"
  ON chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Coordenador pode atualizar capítulos (para revisão)
DROP POLICY IF EXISTS "chapters_update_coord" ON chapters;
CREATE POLICY "chapters_update_coord"
  ON chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'COORDENADOR'
    )
  );

-- =============================================================
-- POLICIES — CHAPTER_VERSIONS
-- =============================================================
DROP POLICY IF EXISTS "cv_select_own" ON chapter_versions;
CREATE POLICY "cv_select_own"
  ON chapter_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      WHERE c.id = chapter_versions.chapter_id
        AND c.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cv_insert_own" ON chapter_versions;
CREATE POLICY "cv_insert_own"
  ON chapter_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters c
      WHERE c.id = chapter_versions.chapter_id
        AND c.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cv_delete_own" ON chapter_versions;
CREATE POLICY "cv_delete_own"
  ON chapter_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      WHERE c.id = chapter_versions.chapter_id
        AND c.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cv_all_admin" ON chapter_versions;
CREATE POLICY "cv_all_admin"
  ON chapter_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

-- =============================================================
-- POLICIES — REVIEWER_NOTES
-- =============================================================
-- Coautor vê notas dos seus capítulos
DROP POLICY IF EXISTS "rn_select_chapter_author" ON reviewer_notes;
CREATE POLICY "rn_select_chapter_author"
  ON reviewer_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chapters c
      WHERE c.id = reviewer_notes.chapter_id
        AND c.author_id = auth.uid()
    )
  );

-- Admin/Coordenador gerenciam notas
DROP POLICY IF EXISTS "rn_all_admin_coord" ON reviewer_notes;
CREATE POLICY "rn_all_admin_coord"
  ON reviewer_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

-- =============================================================
-- POLICIES — MENTORSHIPS
-- =============================================================
-- Qualquer usuário autenticado lê mentorias
DROP POLICY IF EXISTS "mentorships_select_authenticated" ON mentorships;
CREATE POLICY "mentorships_select_authenticated"
  ON mentorships FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "mentorships_all_admin" ON mentorships;
CREATE POLICY "mentorships_all_admin"
  ON mentorships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

-- =============================================================
-- POLICIES — ANNOUNCEMENTS
-- =============================================================
DROP POLICY IF EXISTS "announcements_select_authenticated" ON announcements;
CREATE POLICY "announcements_select_authenticated"
  ON announcements FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "announcements_all_admin" ON announcements;
CREATE POLICY "announcements_all_admin"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'COORDENADOR')
    )
  );

-- =============================================================
-- STORAGE — Bucket "profiles" para avatares
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- Storage RLS: coautor faz upload do próprio avatar
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

DROP POLICY IF EXISTS "profiles_storage_select_public" ON storage.objects;
CREATE POLICY "profiles_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- =============================================================
-- TRIGGER — updated_at automático
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_chapters_updated_at ON chapters;
CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- DADOS INICIAIS DE EXEMPLO (remova se não quiser seed)
-- =============================================================
-- Descomente para inserir dados de teste:

-- INSERT INTO announcements (title, content) VALUES
--   ('Bem-vindo à plataforma NAB!', 'Aqui você encontrará todos os recursos para sua jornada de publicação.'),
--   ('Prazo de entrega do capítulo 1', 'Lembre-se: o prazo é 30/03/2026. Dúvidas? Fale com seu coordenador.')
-- ON CONFLICT DO NOTHING;
