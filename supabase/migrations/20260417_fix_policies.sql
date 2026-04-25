-- ============================================================
-- Fix: políticas duplicadas + RPCs faltando + vínculo LIDER→GESTOR
-- Rodar se 20260417_vendedor_lider.sql falhou pela metade
-- ============================================================

-- ── 1. CHECK CONSTRAINT ────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('ADMIN', 'GESTOR', 'LIDER', 'CS', 'VENDEDOR', 'COORDENADOR', 'COAUTOR'));

-- ── 2. Garantir que lider_id existe em vendedor_assignments ─
-- (caso a rename da outra migration ainda não rodou)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendedor_assignments' AND column_name = 'coordinator_id'
  ) THEN
    ALTER TABLE vendedor_assignments RENAME COLUMN coordinator_id TO lider_id;
  END IF;
END $$;

ALTER TABLE vendedor_assignments
  DROP CONSTRAINT IF EXISTS vendedor_assignments_coordinator_id_fkey;

ALTER TABLE vendedor_assignments
  DROP CONSTRAINT IF EXISTS vendedor_assignments_lider_id_fkey;

ALTER TABLE vendedor_assignments
  ADD CONSTRAINT vendedor_assignments_lider_id_fkey
  FOREIGN KEY (lider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── 3. Políticas vendedor_assignments ──────────────────────
DROP POLICY IF EXISTS "admin_all_vendedor_assignments"        ON vendedor_assignments;
DROP POLICY IF EXISTS "gestor_admin_all_vendedor_assignments" ON vendedor_assignments;
DROP POLICY IF EXISTS "vendedor_read_own_assignments"         ON vendedor_assignments;

CREATE POLICY "gestor_admin_all_vendedor_assignments" ON vendedor_assignments
  FOR ALL TO authenticated
  USING  (get_my_role() IN ('ADMIN', 'GESTOR'))
  WITH CHECK (get_my_role() IN ('ADMIN', 'GESTOR'));

CREATE POLICY "vendedor_read_own_assignments" ON vendedor_assignments
  FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid());

-- ── 4. RPC get_all_vendedores ───────────────────────────────
CREATE OR REPLACE FUNCTION get_all_vendedores()
RETURNS SETOF profiles
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE role = 'VENDEDOR' ORDER BY name;
$$;

-- ── 5. RPC get_my_vendedor_assignments ─────────────────────
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

-- ── 6. RPC get_my_leads_as_vendedor (atualizada com lider_id) ─
DROP FUNCTION IF EXISTS get_my_leads_as_vendedor();
CREATE OR REPLACE FUNCTION get_my_leads_as_vendedor()
RETURNS TABLE(
  id               UUID,
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  status           TEXT,
  notes            TEXT,
  coordinator_id   UUID,
  created_at       TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ,
  coordinator_name TEXT,
  lider_id         UUID,
  lider_name       TEXT
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

-- ── 7. RPC get_all_chapters_cs ──────────────────────────────
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

-- ── 8. Vincular Jorge Murilho (LIDER) ao Jefferson Santos (GESTOR) ─
-- Jorge Murilho (institutojorgemurilho@gmail.com, LIDER) deve ter
-- manager_id apontando para Jefferson Santos (financeiro.jorgemurilho@gmail.com, GESTOR)
UPDATE profiles
SET manager_id = (
  SELECT id FROM profiles WHERE email = 'financeiro.jorgemurilho@gmail.com' LIMIT 1
)
WHERE email = 'institutojorgemurilho@gmail.com'
  AND role = 'LIDER';

-- ── 9. RLS de leads: atualizar para GESTOR + LIDER + VENDEDOR ─
DROP POLICY IF EXISTS "Lideres and vendedores can view assigned leads"   ON leads;
DROP POLICY IF EXISTS "Lideres and vendedores can update assigned leads" ON leads;

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
